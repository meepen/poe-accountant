import { z } from "zod";
import { QueueScheduler } from "./queue-scheduler.abstract.js";
import { db, DbTransaction } from "../connections/db.js";
import {
  CurrencyExchangeHistory,
  CurrencyExchangeHistoryCurrency,
  CurrencyExchangeLeagueSnapshotData,
} from "@meepen/poe-accountant-db-schema/currency-exchange";
import {
  CurrencyExchangeWithRelations,
  CurrencyGraph,
  type VendorRecipe,
} from "./update-currency-data/market-graph.js";
import { and, desc, InferSelectModel, sql } from "drizzle-orm";

const UpdateCurrencySnapshotsJobQueueName =
  "update-currency-snapshots-job-queue";
const UpdateCurrencySnapshotsJobSchema = z.object({});
const SnapshotBackfillBatchSize = 50;
const DirectRateDeviationClamp = 3;

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

type ExchangeSnapshotContext = {
  timestamp: Date;
  nextChangeId: Date;
};

export class UpdateCurrencySnapshotsJob extends QueueScheduler<
  typeof UpdateCurrencySnapshotsJobSchema
> {
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
    const missingSnapshots = await db
      .select()
      .from(CurrencyExchangeHistory)
      .where(
        and(
          sql`exists (select 1 from ${CurrencyExchangeHistoryCurrency} where ${CurrencyExchangeHistoryCurrency.historyId} = ${CurrencyExchangeHistory.id})`,
          sql`not exists (select 1 from ${CurrencyExchangeLeagueSnapshotData} where ${CurrencyExchangeLeagueSnapshotData.historyId} = ${CurrencyExchangeHistory.id})`,
        ),
      )
      .orderBy(desc(CurrencyExchangeHistory.timestamp))
      .limit(SnapshotBackfillBatchSize);

    if (missingSnapshots.length === 0) {
      console.log("[currency-snapshots] No missing snapshots detected.");
      return;
    }

    console.log(
      `[currency-snapshots] Backfilling ${missingSnapshots.length} history records without snapshots...`,
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
  }

  public static async persistExchangeSnapshots(
    tx: DbTransaction,
    realm: string,
    result: ExchangeSnapshotContext,
    historyByLeague: Map<
      string,
      InferSelectModel<typeof CurrencyExchangeHistory>
    >,
  ): Promise<Date | null> {
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
      if (!historyByLeague.has(history.leagueId)) {
        return acc;
      }

      if (!acc.has(history.leagueId)) {
        acc.set(history.leagueId, {
          markets: [],
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          history: historyByLeague.get(history.leagueId)!,
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
        continue;
      }

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
        rates.map<InferSelectModel<typeof CurrencyExchangeLeagueSnapshotData>>(
          (rate) => {
            const directRate = rate.directRate ?? null;
            let valuedAt = rate.optimalRate;
            let calculationPath = rate.path;

            if (directRate && directRate > 0) {
              const ratio = rate.optimalRate / directRate;
              if (
                !Number.isFinite(ratio) ||
                ratio > DirectRateDeviationClamp ||
                ratio < 1 / DirectRateDeviationClamp
              ) {
                valuedAt = directRate;
                calculationPath = [rate.currency, "chaos"];
              }
            }

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
          },
        ),
      );
    }

    return null;
  }
}
