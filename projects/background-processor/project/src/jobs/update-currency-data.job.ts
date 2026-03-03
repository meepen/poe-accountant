import { QueueScheduler } from "./queue-scheduler.abstract.js";
import { z } from "zod";
import { appApi, realms } from "../connections/application-poe-api.js";
import { CurrencyDatabaseManager } from "./update-currency-data/currency-database-manager.js";
import type { DbTransaction } from "../connections/db.js";
import { db } from "../connections/db.js";
import { CurrencyExchangeHistory } from "@meepen/poe-accountant-db-schema/currency-exchange";
import type { InferSelectModel } from "drizzle-orm";
import { desc, eq } from "drizzle-orm";
import { valkey } from "../connections/valkey.js";
import { UpdateCurrencySnapshotsJob } from "./update-currency-snapshots.job.js";

const UpdateCurrencyDataJobQueueName = "update-currency-data-job-queue";
const UpdateCurrencyDataJobSchema = z.object({});
const UpdateCurrencyDataLockKey =
  "{background-processor}:locks:update-currency-data";
const UpdateCurrencyDataLockTtlMs = 5 * 60 * 1000;

export class UpdateCurrencyDataJob extends QueueScheduler<
  typeof UpdateCurrencyDataJobSchema
> {
  protected override readonly returnSchema = z.void();
  protected override readonly queueName = UpdateCurrencyDataJobQueueName;
  protected override readonly schema = UpdateCurrencyDataJobSchema;
  protected override readonly queueData = {};

  // Runs at 5 minutes past every hour
  protected override readonly cron = "5 * * * *";

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
  ): Promise<Awaited<ReturnType<typeof this.getAllExchangeData>> | null> {
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

    return exchangeData;
  }

  private static async processRealm(realm: string): Promise<void> {
    let timestamp: Date | null = null;
    while (
      (timestamp = await db.transaction(async (tx) => {
        const result = await this.processRealmOnce(tx, realm, timestamp);
        if (!result) {
          return null;
        }

        console.log(
          `[${realm}] Processed exchange data for ${result.timestamp.toISOString()}`,
        );

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

  public static async processNow(): Promise<void> {
    const lockToken = crypto.randomUUID();
    const acquired = await valkey.set(
      UpdateCurrencyDataLockKey,
      lockToken,
      "PX",
      UpdateCurrencyDataLockTtlMs,
      "NX",
    );

    if (acquired !== "OK") {
      const ttl = await valkey.pttl(UpdateCurrencyDataLockKey);
      if (ttl === -1) {
        console.warn(
          "[update-currency-data] Lock has no expiry; setting TTL to prevent deadlock.",
        );
        await valkey.pexpire(
          UpdateCurrencyDataLockKey,
          UpdateCurrencyDataLockTtlMs,
        );
      }
      console.log(
        "[update-currency-data] Lock already held, skipping this run.",
      );
      return;
    }

    try {
      await Promise.all(realms.map((realm) => this.processRealm(realm)));
    } finally {
      await valkey.eval(
        "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end",
        1,
        UpdateCurrencyDataLockKey,
        lockToken,
      );
    }

    await UpdateCurrencySnapshotsJob.processNow();
  }

  public override async processJob(): Promise<void> {
    await UpdateCurrencyDataJob.processNow();
  }
}
