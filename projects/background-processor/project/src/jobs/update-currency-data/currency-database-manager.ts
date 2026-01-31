import { InferSelectModel, sql } from "drizzle-orm";
import { DbTransaction } from "../../connections/db.js";
import { CurrencyExchangeGetExchangeMarketsResponse } from "@meepen/poe-common";
import {
  CurrencyExchangeHistoryCurrency,
  CurrencyExchangeHistory,
} from "@meepen/poe-accountant-db-schema";

export class CurrencyDatabaseManager {
  public readonly league: InferSelectModel<typeof CurrencyExchangeHistory>;
  private constructor(
    league?: InferSelectModel<typeof CurrencyExchangeHistory>,
  ) {
    if (!league) {
      throw new Error("League data must be provided");
    }
    this.league = league;
  }

  static async create(
    tx: DbTransaction,
    realm: string,
    leagueId: string,
    timestamp: Date,
    nextTimestamp: Date,
  ) {
    return await tx
      .insert(CurrencyExchangeHistory)
      .values({
        id: crypto.randomUUID(),
        realm,
        leagueId,
        timestamp,
        nextTimestamp:
          nextTimestamp.getTime() === timestamp.getTime()
            ? null
            : nextTimestamp,
      })
      .onConflictDoUpdate({
        set: {
          nextTimestamp: sql`excluded.next_timestamp`,
        },
        target: [
          CurrencyExchangeHistory.realm,
          CurrencyExchangeHistory.leagueId,
          CurrencyExchangeHistory.timestamp,
        ],
      })
      .returning()
      .then((league) => new CurrencyDatabaseManager(league[0]));
  }

  /**
   * Inserts currency data for this league
   * @param data Currency data to insert
   * @returns Whether data was inserted
   */
  public async insertCurrencyData(
    tx: DbTransaction,
    data: CurrencyExchangeGetExchangeMarketsResponse["markets"],
  ): Promise<boolean> {
    const leagueData = data.filter(
      (market) => market.league === this.league.leagueId,
    );
    if (leagueData.length === 0) {
      return false;
    }

    const result = await tx
      .insert(CurrencyExchangeHistoryCurrency)
      .values(
        leagueData.map<
          InferSelectModel<typeof CurrencyExchangeHistoryCurrency>
        >((market) => {
          const [fromCurrency, toCurrency] = market.market_id.split("|");
          return {
            id: crypto.randomUUID(),
            historyId: this.league.id,
            fromCurrency,
            toCurrency,
            highestRatio:
              market.highest_ratio[fromCurrency] /
              market.highest_ratio[toCurrency],
            lowestRatio:
              market.lowest_ratio[fromCurrency] /
              market.lowest_ratio[toCurrency],
            fromVolume: BigInt(market.volume_traded[fromCurrency]),
            toVolume: BigInt(market.volume_traded[toCurrency]),
          };
        }),
      )
      .onConflictDoNothing()
      .returning();

    return result.length > 0;
  }

  public async getCurrencyData(tx: DbTransaction, pastHours: number) {
    const sinceDate = new Date();
    sinceDate.setMinutes(0);
    sinceDate.setSeconds(0);
    sinceDate.setMilliseconds(0);
    sinceDate.setHours(sinceDate.getHours() - pastHours);

    const history = await tx.query.CurrencyExchangeHistory.findMany({
      where: (league, { eq, and, gte }) =>
        and(
          eq(league.leagueId, this.league.id),
          gte(league.timestamp, sinceDate),
        ),
      orderBy: (league, { desc }) => [desc(league.timestamp)],
      with: {
        currencies: true,
      },
    });

    return history.flatMap((historyEntry) =>
      historyEntry.currencies.map((currency) => ({
        currency,
        occurs: historyEntry.timestamp,
      })),
    );
  }
}
