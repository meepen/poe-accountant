import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import type { DbTransaction } from "../../connections/db.js";
import type { CurrencyExchangeGetExchangeMarketsResponse } from "@meepen/poe-common";
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

    const values = leagueData
      .map<InferSelectModel<typeof CurrencyExchangeHistoryCurrency> | null>(
        (market) => {
          const [fromCurrency, toCurrency] = market.market_id.split("|");
          const fromHigh = market.highest_ratio[fromCurrency];
          const toHigh = market.highest_ratio[toCurrency];
          const fromLow = market.lowest_ratio[fromCurrency];
          const toLow = market.lowest_ratio[toCurrency];

          if (
            !Number.isFinite(fromHigh) ||
            !Number.isFinite(toHigh) ||
            !Number.isFinite(fromLow) ||
            !Number.isFinite(toLow) ||
            toHigh <= 0 ||
            toLow <= 0
          ) {
            return null;
          }

          return {
            id: crypto.randomUUID(),
            historyId: this.league.id,
            fromCurrency,
            toCurrency,
            highestRatio: fromHigh / toHigh,
            lowestRatio: fromLow / toLow,
            fromVolume: BigInt(market.volume_traded[fromCurrency]),
            toVolume: BigInt(market.volume_traded[toCurrency]),
          };
        },
      )
      .filter(
        (
          market,
        ): market is InferSelectModel<typeof CurrencyExchangeHistoryCurrency> =>
          market !== null,
      );

    if (values.length === 0) {
      return false;
    }

    const result = await tx
      .insert(CurrencyExchangeHistoryCurrency)
      .values(values)
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
