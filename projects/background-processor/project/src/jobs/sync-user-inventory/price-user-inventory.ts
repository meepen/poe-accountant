import { UserPoeApi } from "../../connections/user-poe-api.js";
import { type InferSelectModel } from "drizzle-orm";
import {
  CurrencyExchangeHistory,
  CurrencyExchangeLeagueSnapshotData,
  type League,
  type User,
} from "@meepen/poe-accountant-db-schema";
import {
  SyncUserInventoryJobDataSchemaVersion,
  type SyncUserInventoryJobDataDto,
} from "@meepen/poe-accountant-api-schema";
import type { Item, StashTab } from "@meepen/poe-common";
import { StaticTradeDataJob } from "../static-trade-data.job.js";
import { db } from "../../connections/db.js";
import { and, eq, desc } from "drizzle-orm";

enum ItemType {
  Currency = "Currency",
}

const NormalStashTypes = ["NormalStash", "PremiumStash"];

type SyncUserInventoryItems = SyncUserInventoryJobDataDto["items"];

const ItemTypePricers = new Map<
  ItemType,
  (
    league: InferSelectModel<typeof League>,
    items: { item: Item; stash: StashTab }[],
  ) => Promise<SyncUserInventoryItems>
>([
  [
    ItemType.Currency,
    async (league, items) => {
      // Search for items in the currency exchange data
      const applicableItems = items
        .map(({ stash, item }) => ({
          stash,
          item,
          staticInfo: StaticTradeDataJob.tradeDataByName.get(item.baseType),
        }))
        .filter(
          (
            entry,
          ): entry is {
            staticInfo: NonNullable<typeof entry.staticInfo>;
          } & typeof entry => entry.staticInfo !== undefined,
        );

      const lookupSet = new Set(
        applicableItems.map((entry) => entry.item.baseType),
      );

      if (lookupSet.size === 0) {
        return {};
      }

      // Retrieve the latest currency exchange data for each
      const latestCurrency = await db
        .selectDistinctOn([CurrencyExchangeLeagueSnapshotData.currency]) // Grabs exactly 1 per currency
        .from(CurrencyExchangeHistory)
        .innerJoin(
          CurrencyExchangeLeagueSnapshotData,
          eq(
            CurrencyExchangeHistory.id,
            CurrencyExchangeLeagueSnapshotData.historyId,
          ),
        )
        .where(
          and(
            eq(CurrencyExchangeHistory.leagueId, league.leagueId),
            eq(CurrencyExchangeHistory.realm, league.realm),
          ),
        )
        // Order by fromCurrency first (required by distinctOn), then by timestamp to get the newest
        .orderBy(
          CurrencyExchangeLeagueSnapshotData.currency,
          desc(CurrencyExchangeHistory.timestamp),
        );

      const snapshotData = latestCurrency.reduce((map, data) => {
        map.set(data.currency_exchange_league_snapshot_data.currency, data);
        return map;
      }, new Map<string, (typeof latestCurrency)[number]>());

      return applicableItems.reduce<SyncUserInventoryItems>(
        (result, history) => {
          const matchingData = snapshotData.get(history.staticInfo.id);
          if (!matchingData) {
            return result;
          }

          const value =
            Number(
              matchingData.currency_exchange_league_snapshot_data.valuedAt,
            ) * (history.item.stackSize ?? 1);
          if (Number.isNaN(value)) {
            return result;
          }

          if (!(history.staticInfo.text in result)) {
            result[history.staticInfo.text] = [];
          }

          const itemId = history.item.id ?? history.item.baseType;
          const itemName =
            history.item.name.trim() ||
            history.item.typeLine.trim() ||
            history.item.baseType;
          const icon = history.item.icon || null;
          const valueCurrency =
            matchingData.currency_exchange_league_snapshot_data.stableCurrency;

          result[history.staticInfo.text].push({
            itemId,
            itemName,
            icon,
            count: history.item.stackSize ?? 1,
            value,
            valueCurrency,
            location: history.stash.name,
            stashTabId: history.stash.id,
            stashTabName: history.stash.name,
          });

          return result;
        },
        {},
      );
    },
  ],
]);

export function categorizeItem(item: Item): ItemType | undefined {
  if (StaticTradeDataJob.tradeDataByName.has(item.baseType)) {
    return ItemType.Currency;
  }

  return undefined;
}

export async function priceUserInventory(
  user: InferSelectModel<typeof User>,
  league: InferSelectModel<typeof League>,
): Promise<SyncUserInventoryJobDataDto> {
  const api = UserPoeApi.getOrCreate(user.id, user.accessToken, user.scope);

  const shortStashList = (
    await api.listStashes({
      league: league.leagueId,
      realm: league.realm,
    })
  ).stashes
    .flatMap((stash) =>
      stash.type === "Folder" ? (stash.children ?? []) : [stash],
    )
    .filter(
      (stash) =>
        !NormalStashTypes.includes(stash.type) &&
        !stash.name.endsWith("(Remove-only)"),
    );

  console.log(
    `Found ${shortStashList.length} stashes for user ${user.id} in league ${league.leagueId}.`,
  );
  const stashesByType = shortStashList.reduce<
    Record<string, typeof shortStashList>
  >((result, stash) => {
    if (!stash.type) {
      return result;
    }
    if (!(stash.type in result)) {
      result[stash.type] = [];
    }
    result[stash.type].push(stash);
    return result;
  }, {});

  for (const [type, stashes] of Object.entries(stashesByType).sort(
    (a, b) => b[1].length - a[1].length,
  )) {
    console.log(`Stash type ${type}: ${stashes.length} stashes.`);
  }

  const stashList = await Promise.all(
    shortStashList.map(async (stash) =>
      api.getStash({
        league: league.leagueId,
        realm: league.realm,
        stash_id: stash.id,
      }),
    ),
  );

  const collapsedItems = stashList
    .map((stash) => stash.stash)
    .filter((stash): stash is NonNullable<typeof stash> => Boolean(stash))
    .flatMap(
      (stash) =>
        stash.items?.map((item) => ({
          item,
          stash,
        })) ?? [],
    );

  console.log(
    `Found ${collapsedItems.length} items in total for user ${user.id} in league ${league.leagueId}.`,
  );

  const categorizedItems = collapsedItems.reduce<{
    [key in ItemType]?: { item: Item; stash: StashTab }[];
  }>((result, data) => {
    const category = categorizeItem(data.item);
    if (category) {
      if (!(category in result)) {
        result[category] = [];
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      result[category]!.push(data);
    }
    return result;
  }, {});

  for (const [category, items] of Object.entries(categorizedItems).sort(
    (a, b) => b[1].length - a[1].length,
  )) {
    console.log(`Category ${category}: ${items.length} items.`);
  }

  const results = await Promise.all(
    Array.from(ItemTypePricers.entries()).map(async ([itemType, pricer]) => {
      if (!(itemType in categorizedItems)) {
        return {};
      }
      return pricer(league, categorizedItems[itemType] ?? []);
    }),
  );

  const items = results.reduce<SyncUserInventoryItems>((acc, result) => {
    for (const [key, value] of Object.entries(result)) {
      if (!(key in acc)) {
        acc[key] = [];
      }
      acc[key].push(...value);
    }
    return acc;
  }, {});

  const stashTabs = shortStashList.map((stash) => ({
    id: stash.id,
    name: stash.name,
    color: stash.metadata.colour ?? undefined,
  }));

  return {
    schemaVersion: SyncUserInventoryJobDataSchemaVersion,
    items,
    stashTabs,
  };
}
