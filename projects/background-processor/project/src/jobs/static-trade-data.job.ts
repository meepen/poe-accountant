import type { JobProcess } from "../job-process.interface.js";
import { TradeApi, type StaticTradeData } from "../connections/trade-api.js";
import {
  StaticTradeDataSnapshotRedisKey,
  type StaticTradeDataSnapshot,
} from "@meepen/poe-accountant-api-schema";
import { valkey } from "../connections/valkey.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getEnvVar } from "../utils.js";
import { cdnBucketName, cdnS3 } from "../connections/s3.js";

const StaticTradeDataRefreshIntervalMs = 60 * 60 * 1000;
const PoeImageBaseUrl = "https://pathofexile.com";
const StaticTradeImageObjectPrefix = "static-trade/images";
const StaticTradeImageCacheControl = "public, max-age=31536000, immutable";

function getStaticTradeImageObjectKey(entryId: string): string {
  return `${StaticTradeImageObjectPrefix}/${entryId}`;
}

function getStaticTradeImageUrl(baseUrl: string, objectKey: string): string {
  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;

  return `${normalizedBaseUrl}/${objectKey}`;
}

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

  private readonly staticTradeImageBaseUrl = getEnvVar("CDN_BASE_URL");

  private resolveTradeImageSourceUrl(image: string): string {
    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    return new URL(image, PoeImageBaseUrl).toString();
  }

  private async syncTradeImage(
    entryId: string,
    image: string,
  ): Promise<string> {
    const sourceUrl = this.resolveTradeImageSourceUrl(image);
    const { content, contentType } =
      await this.tradeApi.downloadImage(sourceUrl);

    const objectKey = getStaticTradeImageObjectKey(entryId);

    await cdnS3.send(
      new PutObjectCommand({
        Bucket: cdnBucketName,
        Key: objectKey,
        Body: content,
        ContentType: contentType,
        CacheControl: StaticTradeImageCacheControl,
      }),
    );

    return getStaticTradeImageUrl(this.staticTradeImageBaseUrl, objectKey);
  }

  private async syncTradeImages(tradeData: StaticTradeData): Promise<void> {
    await Promise.all(
      tradeData.result
        .flatMap((category) => category.entries)
        .filter(
          (
            entry,
          ): entry is typeof entry & {
            image: NonNullable<typeof entry.image>;
          } => Boolean(entry.image),
        )
        .map(async (entry) => {
          entry.image = await this.syncTradeImage(entry.id, entry.image);
        }),
    );
  }

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
    console.log("[static-trade-data] Refreshing static trade data cache...");
    const tradeData = await this.tradeApi.getStaticData();
    console.log(
      "[static-trade-data] Successfully fetched static trade data from API.",
    );

    console.log("[static-trade-data] Syncing static trade data images...");
    await this.syncTradeImages(tradeData);
    StaticTradeDataJob.tradeData = tradeData;
    console.log(
      "[static-trade-data] Static trade data images synced and cache updated.",
    );

    const snapshot: StaticTradeDataSnapshot = {
      refreshedAt: new Date().toISOString(),
      data: tradeData,
    };
    await valkey.set(StaticTradeDataSnapshotRedisKey, JSON.stringify(snapshot));
    console.log(
      "[static-trade-data] Static trade data snapshot stored in cache with TTL.",
    );
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
