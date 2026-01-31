import { QueueScheduler } from "./queue-scheduler.abstract.js";
import { z } from "zod";
import { appApi, realms } from "../connections/poe-api.js";
import {
  CurrencyExchangeWithRelations,
  CurrencyGraph,
  type VendorRecipe,
} from "./update-currency-data/market-graph.js";
import { CurrencyDatabaseManager } from "./update-currency-data/currency-database-manager.js";
import { db, DbTransaction } from "../connections/db.js";
import {
  CurrencyExchangeHistory,
  CurrencyExchangeLeagueSnapshotData,
} from "@meepen/poe-accountant-db-schema/currency-exchange";
import { desc, eq, InferSelectModel } from "drizzle-orm";

const UpdateCurrencyDataJobQueueName = "update-currency-data-job-queue";
const UpdateCurrencyDataJobSchema = z.object({});

// --- Vendor Recipe Constants ---
// TODO: this should probably live in a database or something more dynamic

const STANDARD_VENDOR_RECIPES: readonly VendorRecipe[] = [
  // --- Upgrades (Buying from Vendor) ---
  // Nessa (Act 1)
  { from: "scroll_of_wisdom", to: "portal_scroll", rate: 1 / 3 },
  { from: "portal_scroll", to: "orb_of_transmutation", rate: 1 / 7 },
  { from: "orb_of_transmutation", to: "orb_of_augmentation", rate: 1 / 4 },
  { from: "orb_of_augmentation", to: "orb_of_alteration", rate: 1 / 4 },

  // Yeena (Act 2)
  { from: "orb_of_alteration", to: "jewellers_orb", rate: 1 / 2 },
  { from: "jewellers_orb", to: "orb_of_fusing", rate: 1 / 4 },

  // Yeena / Clarissa (Act 3)
  // Note: Yeena sells Chance for 1 Fusing
  { from: "orb_of_fusing", to: "orb_of_chance", rate: 1 },
  { from: "orb_of_chance", to: "orb_of_scouring", rate: 1 / 4 },
  { from: "orb_of_scouring", to: "orb_of_regret", rate: 1 / 2 },
  { from: "orb_of_regret", to: "orb_of_alchemy", rate: 1 },

  // --- Downgrades (Selling to Vendor - Hard Floor Prices) ---
  { from: "orb_of_transmutation", to: "scroll_of_wisdom", rate: 4 },
  { from: "orb_of_alteration", to: "scroll_of_wisdom", rate: 4 },
  { from: "blacksmiths_whetstone", to: "scroll_of_wisdom", rate: 4 },
  { from: "armourers_scrap", to: "scroll_of_wisdom", rate: 2 },
  { from: "portal_scroll", to: "scroll_of_wisdom", rate: 1 },
];

const RUTHLESS_VENDOR_RECIPES: readonly VendorRecipe[] = [
  // Ruthless specifically disables the "Shop" aspect of currency.
  // Yeena does NOT sell Jewellers/Fusings.
  // We only include the hard-floor liquidations that still function.

  { from: "orb_of_transmutation", to: "scroll_of_wisdom", rate: 4 },
  { from: "blacksmiths_whetstone", to: "scroll_of_wisdom", rate: 4 },
  { from: "armourers_scrap", to: "scroll_of_wisdom", rate: 2 },
  { from: "portal_scroll", to: "scroll_of_wisdom", rate: 1 },
];

export class UpdateCurrencyDataJob extends QueueScheduler<
  typeof UpdateCurrencyDataJobSchema
> {
  protected override readonly returnSchema = z.void();
  protected override readonly queueName = UpdateCurrencyDataJobQueueName;
  protected override readonly schema = UpdateCurrencyDataJobSchema;
  protected override readonly queueData = {};

  protected override readonly cron = "* * * * *";

  private static async getAllExchangeData(realm: string, id?: Date) {
    const currencyData = await appApi.getExchangeMarkets({
      realm,
      id: id ? String(Math.floor(id.getTime() / 1000)) : undefined,
    });
    // group by markets['league']
    return {
      realm,
      // Edge case: the first data we get back will have no 'id' technically, so we need to handle that
      // Let's just assume we won't be running this within an hour of a new realm appearing...
      timestamp:
        id ?? new Date(currencyData.next_change_id * 1000 - 60 * 60 * 1000),
      nextChangeId: new Date(currencyData.next_change_id * 1000),
      markets: currencyData.markets.reduce((acc, market) => {
        if (!acc.has(market.league)) {
          acc.set(market.league, []);
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        acc.get(market.league)!.push(market);
        return acc;
      }, new Map<string, typeof currencyData.markets>()),
    };
  }

  private static getReasonableInitialDate(): Date {
    const now = new Date();
    now.setMinutes(0, 0);
    now.setSeconds(0, 0);
    now.setDate(now.getDate() - 7);
    return now;
  }

  /**
   * Processes a realm's newest (to us) currency exchange data
   * @param realm Realm to process
   * @returns The latest processed exchange data, or null if no new data was found
   */
  private static async processRealmOnce(
    tx: DbTransaction,
    realm: string,
    nextTimestamp?: Date | null,
  ): Promise<
    | [
        Awaited<ReturnType<typeof this.getAllExchangeData>>,
        Map<string, CurrencyDatabaseManager>,
      ]
    | null
  > {
    console.log(`[${realm}] Checking for new exchange data...`);
    const latestId = nextTimestamp
      ? null
      : await tx
          .select()
          .from(CurrencyExchangeHistory)
          .where((league) => eq(league.realm, realm))
          .orderBy((league) => desc(league.timestamp))
          .limit(1)
          .then<InferSelectModel<typeof CurrencyExchangeHistory> | null>(
            (rows) => rows[0] || null,
          );

    console.log(
      `[${realm}] Latest known exchange data timestamp: ${
        (nextTimestamp ?? latestId?.timestamp)?.toISOString() ?? "none"
      }`,
    );
    // Get the list of exchanges based on the most recent timstamp we have in the database.
    const exchangeData = nextTimestamp
      ? await this.getAllExchangeData(realm, nextTimestamp)
      : latestId
        ? latestId.nextTimestamp
          ? // We know the next timestamp, so use that to get new data
            await this.getAllExchangeData(realm, latestId.nextTimestamp)
          : // Otherwise, we need to fetch twice...
            await this.getAllExchangeData(realm, latestId.timestamp).then(
              (data) =>
                data.timestamp === data.nextChangeId
                  ? null
                  : this.getAllExchangeData(realm, data.nextChangeId),
            )
        : await this.getAllExchangeData(realm, this.getReasonableInitialDate());

    if (!exchangeData) {
      console.log(`No new exchange data for realm ${realm}`);
      return null;
    }

    // For each league in the exchange data, ensure we have a CurrencyDatabaseManager
    const leagueList = new Map(
      await Promise.all(
        exchangeData.markets
          .keys()
          .map(
            async (league) =>
              [
                league,
                await CurrencyDatabaseManager.create(
                  tx,
                  realm,
                  league,
                  exchangeData.timestamp,
                  exchangeData.nextChangeId,
                ),
              ] as const,
          ),
      ),
    );

    await Promise.all(
      leagueList.entries().map(async ([league, manager]) => {
        const markets = exchangeData.markets.get(league);
        if (!markets) {
          console.warn(
            `[${realm}] [${league}] No market data found in exchange data, skipping...`,
          );
          return;
        }

        await manager.insertCurrencyData(tx, markets);
      }),
    );

    return [exchangeData, leagueList];
  }

  private static async processRealm(realm: string): Promise<void> {
    let timestamp: Date | null = null;
    while (
      (timestamp = await db.transaction(async (tx) => {
        const data = await this.processRealmOnce(tx, realm, timestamp);
        if (!data) {
          return null;
        }

        const [result, leagueList] = data;

        console.log(
          `[${realm}] Processed exchange data for ${result.timestamp.toISOString()}`,
        );

        // Retrieve 24 hours of data for this realm to build the market graph
        const sinceDate = new Date(
          result.timestamp.getTime() - 24 * 60 * 60 * 1000,
        );
        const currencyData = await tx.query.CurrencyExchangeHistory.findMany({
          where: (league, { and, eq, between }) =>
            and(
              eq(league.realm, realm),
              between(league.timestamp, sinceDate, result.timestamp),
            ),
          orderBy: (league, { desc }) => [desc(league.timestamp)],
          with: {
            currencies: true,
          },
        });

        const currenciesByLeague = currencyData.reduce((acc, history) => {
          if (!leagueList.has(history.leagueId)) {
            return acc;
          }

          if (!acc.has(history.leagueId)) {
            acc.set(history.leagueId, {
              markets: [],
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              history: leagueList.get(history.leagueId)!.league,
            });
          }
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          acc.get(history.leagueId)!.markets.push(
            ...history.currencies.map<CurrencyExchangeWithRelations>(
              (currency) => ({
                ...currency,
                history,
              }),
            ),
          );
          return acc;
        }, new Map<string, { markets: CurrencyExchangeWithRelations[]; history: InferSelectModel<typeof CurrencyExchangeHistory> }>());

        for (const [leagueId, { markets, history }] of currenciesByLeague) {
          console.log(
            `[${realm}] [${leagueId}] Retrieved ${markets.length} market entries for graphing`,
          );

          // TODO: Determine if the league is Ruthless properly, this requires the parent League to be populated which isn't always the case...
          const isRuthless = leagueId.toLowerCase().includes("ruthless");

          const currencyGraph = new CurrencyGraph(
            markets,
            isRuthless ? RUTHLESS_VENDOR_RECIPES : STANDARD_VENDOR_RECIPES,
          );

          const rates = Array.from(
            currencyGraph
              .getRatesRelativeTo("chaos")
              .values()
              .filter((rate) => rate.currency !== "chaos"),
          );

          if (rates.length === 0) {
            console.warn(
              `[${realm}] [${leagueId}] No currency rates calculated, skipping database snapshot.`,
            );
            return result.nextChangeId;
          }

          console.log(
            `[${realm}] [${leagueId}] [${result.timestamp.toISOString()}] Rates relative to chaos:`,
          );
          for (const rate of rates) {
            console.log(
              ` - ${rate.currency}: ${rate.optimalRate.toFixed(4)} (path: ${rate.path.join(
                " -> ",
              )}, reliability: ${rate.reliability.toFixed(1)}%, liquidity: ${rate.liquidity.toString()})`,
            );
          }
          await tx.insert(CurrencyExchangeLeagueSnapshotData).values(
            rates.map<
              InferSelectModel<typeof CurrencyExchangeLeagueSnapshotData>
            >((rate) => ({
              historyId: history.id,
              currency: rate.currency,
              valuedAt: rate.optimalRate.toString(),
              stableCurrency: "chaos",
              directMarketRate: rate.directRate
                ? rate.directRate.toString()
                : null,
              confidenceScore: rate.reliability,
              liquidity: rate.liquidity,
              dataStaleness: result.timestamp,
              calculationPath: rate.path,
            })),
          );
        }

        if (result.timestamp.getTime() === result.nextChangeId.getTime()) {
          return null;
        }

        return result.nextChangeId;
      }))
    ) {
      console.log(
        `[${realm}] Checking for additional exchange data after ${timestamp.toISOString()}...`,
      );
    }
  }

  public static async processOnce(): Promise<void> {
    await Promise.all(realms.map((realm) => this.processRealm(realm)));
  }

  public override async processJob(): Promise<void> {
    await UpdateCurrencyDataJob.processOnce();
  }
}
