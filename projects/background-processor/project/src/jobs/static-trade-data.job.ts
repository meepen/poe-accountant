import type { JobProcess } from "../job-process.interface.js";
import { TradeApi, type StaticTradeData } from "../connections/trade-api.js";
import {
  StaticTradeDataSnapshotRedisKey,
  StaticTradeDataSnapshotRedisTtlSeconds,
  type StaticTradeDataSnapshot,
} from "@meepen/poe-accountant-api-schema";
import { valkey } from "../connections/valkey.js";

const StaticTradeDataRefreshIntervalMs = 60 * 60 * 1000;

type CollapsedTradeDataEntry =
  StaticTradeData["result"][number]["entries"][number] & {
    category: Omit<StaticTradeData["result"][number], "entries">;
  };

export class StaticTradeDataJob implements JobProcess {
  private static tradeDataCache: StaticTradeData | null = null;
  private static readonly tradeDataCollapsed =
    new Set<CollapsedTradeDataEntry>();
  public static readonly tradeDataByName = new Map<
    string,
    CollapsedTradeDataEntry
  >();
  public static readonly tradeDataById = new Map<
    string,
    CollapsedTradeDataEntry
  >();

  private intervalHandle: NodeJS.Timeout | null = null;

  private readonly tradeApi = new TradeApi();

  public static get tradeData(): StaticTradeData {
    if (!this.tradeDataCache) {
      throw new Error("Static trade data has not been loaded yet.");
    }

    return this.tradeDataCache;
  }

  private static set tradeData(value: StaticTradeData) {
    this.tradeDataCache = value;
    // Rebuild map as well
    this.tradeDataCollapsed.clear();
    for (const category of value.result) {
      for (const entry of category.entries) {
        this.tradeDataCollapsed.add({
          ...entry,
          category: {
            id: category.id,
            label: category.label,
          },
        });
      }
    }

    // Update maps
    this.tradeDataByName.clear();
    this.tradeDataById.clear();
    for (const entry of this.tradeDataCollapsed) {
      this.tradeDataByName.set(entry.text, entry);
      this.tradeDataById.set(entry.id, entry);
    }
  }

  public static get hasCachedStaticTradeData(): boolean {
    return this.tradeDataCache !== null;
  }

  public async processNow(): Promise<void> {
    const tradeData = await this.tradeApi.getStaticData();
    StaticTradeDataJob.tradeData = tradeData;

    const snapshot: StaticTradeDataSnapshot = {
      refreshedAt: new Date().toISOString(),
      data: tradeData,
    };

    await valkey.set(
      StaticTradeDataSnapshotRedisKey,
      JSON.stringify(snapshot),
      "EX",
      StaticTradeDataSnapshotRedisTtlSeconds,
    );

    console.log("[static-trade-data] Refreshed static trade data cache.");
  }

  public start(): void {
    this.intervalHandle = setInterval(() => {
      void this.processNow().catch((error: unknown) => {
        console.error(
          "[static-trade-data] Failed to refresh static trade data cache:",
          error,
        );
      });
    }, StaticTradeDataRefreshIntervalMs);
  }

  public stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }
}
