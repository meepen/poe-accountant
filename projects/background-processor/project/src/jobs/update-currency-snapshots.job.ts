import { z } from "zod";
import { QueueScheduler } from "./queue-scheduler.abstract.js";
import type { DbTransaction } from "../connections/db.js";
import { db } from "../connections/db.js";
import type { CurrencyExchangeHistory } from "@meepen/poe-accountant-db-schema/currency-exchange";
import { CurrencyExchangeLeagueSnapshotData } from "@meepen/poe-accountant-db-schema/currency-exchange";
import type { CurrencyExchangeWithRelations } from "./update-currency-data/market-graph.js";
import {
  CurrencyGraph,
  type VendorRecipe,
} from "./update-currency-data/market-graph.js";
import type { InferSelectModel } from "drizzle-orm";

const UpdateCurrencySnapshotsJobQueueName =
  "update-currency-snapshots-job-queue";
const UpdateCurrencySnapshotsJobSchema = z.object({});
const SnapshotBackfillBatchSize = 50;

// --- Vendor Recipe Constants ---
// TODO: this should probably live in a database or something more dynamic

const STANDARD_VENDOR_RECIPES: readonly VendorRecipe[] = [
  // --- Upgrades (Buying from Vendor) ---
  // Nessa (Act 1)
  { from: "wisdom", to: "portal", rate: 1 / 3 },
  { from: "portal", to: "transmute", rate: 1 / 7 },
  { from: "transmute", to: "aug", rate: 1 / 4 },
  { from: "aug", to: "alt", rate: 1 / 4 },

  // Yeena (Act 2)
  { from: "alt", to: "jewellers", rate: 1 / 2 },
  { from: "jewellers", to: "fusing", rate: 1 / 4 },

  // Yeena / Clarissa (Act 3)
  // Note: Yeena sells Chance for 1 Fusing
  { from: "fusing", to: "chance", rate: 1 },
  { from: "chance", to: "scour", rate: 1 / 4 },
  { from: "scour", to: "regret", rate: 1 / 2 },
  { from: "regret", to: "alch", rate: 1 },

  // --- Downgrades (Selling to Vendor - Hard Floor Prices) ---
  { from: "transmute", to: "wisdom", rate: 4 },
  { from: "alt", to: "wisdom", rate: 4 },
  { from: "whetstone", to: "wisdom", rate: 4 },
  { from: "scrap", to: "wisdom", rate: 2 },
  { from: "portal", to: "wisdom", rate: 1 },
];

const RUTHLESS_VENDOR_RECIPES: readonly VendorRecipe[] = [
  // Ruthless specifically disables the "Shop" aspect of currency.
  // Yeena does NOT sell Jewellers/Fusings.
  // We only include the hard-floor liquidations that still function.

  { from: "transmute", to: "wisdom", rate: 4 },
  { from: "whetstone", to: "wisdom", rate: 4 },
  { from: "scrap", to: "wisdom", rate: 2 },
  { from: "portal", to: "wisdom", rate: 1 },
];

type ExchangeSnapshotContext = {
  timestamp: Date;
  nextChangeId: Date;
};

type CurrencyExchangeMarket = Omit<CurrencyExchangeWithRelations, "history">;

type SnapshotHistoryRecord = InferSelectModel<
  typeof CurrencyExchangeHistory
> & {
  currencies: CurrencyExchangeMarket[];
};

type LeagueMarketSnapshot = {
  markets: CurrencyExchangeWithRelations[];
  history: InferSelectModel<typeof CurrencyExchangeHistory>;
};

export class UpdateCurrencySnapshotsJob extends QueueScheduler<
  typeof UpdateCurrencySnapshotsJobSchema
> {
  protected override readonly concurrency = 1;
  protected override readonly returnSchema = z.void();
  protected override readonly queueName = UpdateCurrencySnapshotsJobQueueName;
  protected override readonly schema = UpdateCurrencySnapshotsJobSchema;
  protected override readonly queueData = {};

  // Runs at 20 minutes past every hour
  protected override readonly cron = "20 * * * *";

  public override async processJob(): Promise<void> {
    await UpdateCurrencySnapshotsJob.processNow();
  }

  public static async processNow(): Promise<void> {
    let batch = 0;
    let cursor: { timestamp: Date; id: string } | null = null;
    let processing = true;

    while (processing) {
      const candidates = await db.query.CurrencyExchangeHistory.findMany({
        where: (history, { and, lt, eq, or }) => {
          if (!cursor) {
            return undefined;
          }
          return or(
            lt(history.timestamp, cursor.timestamp),
            and(
              eq(history.timestamp, cursor.timestamp),
              lt(history.id, cursor.id),
            ),
          );
        },
        orderBy: (history, { desc }) => [
          desc(history.timestamp),
          desc(history.id),
        ],
        limit: SnapshotBackfillBatchSize,
        with: {
          currencies: {
            limit: 1,
            columns: {
              id: true,
            },
          },
          snapshotData: {
            limit: 1,
            columns: {
              historyId: true,
            },
          },
        },
      });

      if (candidates.length === 0) {
        if (batch === 0) {
          console.log("[currency-snapshots] No missing snapshots detected.");
        }
        processing = false;
        continue;
      }

      // Update cursor for next iteration
      const last = candidates[candidates.length - 1];
      cursor = { timestamp: last.timestamp, id: last.id };

      const missingSnapshots = candidates.filter(
        (h) => h.currencies.length > 0 && h.snapshotData.length === 0,
      );

      if (missingSnapshots.length === 0) {
        batch++;
        continue;
      }

      console.log(
        `[currency-snapshots] Batch ${batch + 1}: Backfilling ${
          missingSnapshots.length
        } history records without snapshots...`,
      );

      for (const history of missingSnapshots) {
        await db.transaction(async (tx) => {
          const existingSnapshot =
            await tx.query.CurrencyExchangeLeagueSnapshotData.findFirst({
              where: (data, { eq }) => eq(data.historyId, history.id),
              columns: {
                historyId: true,
              },
            });
          if (existingSnapshot) {
            console.log(
              `[currency-snapshots] Snapshot already exists for history ${history.id}, skipping.`,
            );
            return;
          }

          const historyByLeague = new Map<
            string,
            InferSelectModel<typeof CurrencyExchangeHistory>
          >([[history.leagueId, history]]);

          await this.persistExchangeSnapshots(
            tx,
            history.realm,
            {
              timestamp: history.timestamp,
              nextChangeId: history.nextTimestamp ?? history.timestamp,
            },
            historyByLeague,
          );
        });
      }
      batch++;
    }
  }

  public static async persistExchangeSnapshots(
    tx: DbTransaction,
    realm: string,
    result: ExchangeSnapshotContext,
    historyByLeague: Map<
      string,
      InferSelectModel<typeof CurrencyExchangeHistory>
    >,
  ): Promise<void> {
    const targetLeagueIds = Array.from(historyByLeague.keys());
    const currencyData = await this.fetchRecentCurrencyHistory(
      tx,
      realm,
      result.timestamp,
      targetLeagueIds,
    );
    const currenciesByLeague = this.groupMarketsByLeague(
      currencyData,
      historyByLeague,
    );

    for (const [leagueId, { markets, history }] of currenciesByLeague) {
      if (await this.hasExistingSnapshot(tx, history.id)) {
        console.log(
          `[currency-snapshots] Snapshot already exists for history ${history.id}, skipping.`,
        );
        continue;
      }

      const rates = this.calculateRatesForLeague(realm, leagueId, markets);

      if (rates.length === 0) {
        console.warn(
          `[${realm}] [${leagueId}] No currency rates calculated, skipping database snapshot.`,
        );
        continue;
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
      await tx
        .insert(CurrencyExchangeLeagueSnapshotData)
        .values(
          rates.map<
            InferSelectModel<typeof CurrencyExchangeLeagueSnapshotData>
          >((rate) => {
            const directRate = rate.directRate ?? null;
            const valuedAt = rate.optimalRate;
            const calculationPath = rate.path;

            return {
              historyId: history.id,
              currency: rate.currency,
              valuedAt: valuedAt.toString(),
              stableCurrency: "chaos",
              directMarketRate: directRate ? directRate.toString() : null,
              confidenceScore: rate.reliability,
              liquidity: rate.liquidity,
              dataStaleness: result.timestamp,
              calculationPath,
            };
          }),
        )
        .onConflictDoNothing({
          target: [
            CurrencyExchangeLeagueSnapshotData.historyId,
            CurrencyExchangeLeagueSnapshotData.currency,
            CurrencyExchangeLeagueSnapshotData.stableCurrency,
          ],
        });
    }

    return;
  }

  private static async fetchRecentCurrencyHistory(
    tx: DbTransaction,
    realm: string,
    timestamp: Date,
    targetLeagueIds: string[],
  ): Promise<SnapshotHistoryRecord[]> {
    const sinceDate = new Date(timestamp.getTime() - 24 * 60 * 60 * 1000);
    return tx.query.CurrencyExchangeHistory.findMany({
      where: (league, { and, eq, between, inArray }) =>
        and(
          eq(league.realm, realm),
          inArray(league.leagueId, targetLeagueIds),
          between(league.timestamp, sinceDate, timestamp),
        ),
      orderBy: (league, { desc }) => [desc(league.timestamp)],
      with: {
        currencies: true,
      },
      columns: {
        id: true,
        leagueId: true,
        realm: true,
        timestamp: true,
        nextTimestamp: true,
        createdAt: true,
      },
    });
  }

  private static groupMarketsByLeague(
    currencyData: SnapshotHistoryRecord[],
    historyByLeague: Map<
      string,
      InferSelectModel<typeof CurrencyExchangeHistory>
    >,
  ): Map<string, LeagueMarketSnapshot> {
    return currencyData.reduce((acc, history) => {
      const existingHistory = historyByLeague.get(history.leagueId);
      if (!existingHistory) {
        return acc;
      }

      const leagueSnapshot = acc.get(history.leagueId) ?? {
        markets: [],
        history: existingHistory,
      };

      leagueSnapshot.markets.push(
        ...history.currencies.map<CurrencyExchangeWithRelations>(
          (currency) => ({
            ...currency,
            history,
          }),
        ),
      );

      acc.set(history.leagueId, leagueSnapshot);
      return acc;
    }, new Map<string, LeagueMarketSnapshot>());
  }

  private static async hasExistingSnapshot(
    tx: DbTransaction,
    historyId: string,
  ): Promise<boolean> {
    const existingSnapshot =
      await tx.query.CurrencyExchangeLeagueSnapshotData.findFirst({
        where: (data, { eq }) => eq(data.historyId, historyId),
        columns: {
          historyId: true,
        },
      });
    return Boolean(existingSnapshot);
  }

  private static calculateRatesForLeague(
    realm: string,
    leagueId: string,
    markets: CurrencyExchangeWithRelations[],
  ) {
    console.log(
      `[${realm}] [${leagueId}] Retrieved ${markets.length} market entries for graphing`,
    );

    // TODO: Determine if the league is Ruthless properly, this requires the parent League to be populated which isn't always the case...
    const isRuthless = leagueId.toLowerCase().includes("ruthless");

    console.time(`[${realm}] [${leagueId}] Graph construction`);
    const currencyGraph = new CurrencyGraph(
      markets,
      isRuthless ? RUTHLESS_VENDOR_RECIPES : STANDARD_VENDOR_RECIPES,
    );
    console.timeEnd(`[${realm}] [${leagueId}] Graph construction`);

    console.time(`[${realm}] [${leagueId}] Rate calculation`);
    const rates = Array.from(
      currencyGraph
        .getRatesRelativeTo("chaos")
        .values()
        .filter((rate) => rate.currency !== "chaos"),
    );
    console.timeEnd(`[${realm}] [${leagueId}] Rate calculation`);

    return rates;
  }
}
