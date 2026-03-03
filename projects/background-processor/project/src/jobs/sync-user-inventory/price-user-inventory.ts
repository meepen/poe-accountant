import { UserPoeApi } from "../../connections/user-poe-api.js";
import { type InferSelectModel } from "drizzle-orm";
import { type League, type User } from "@meepen/poe-accountant-db-schema";
import type { SyncUserInventoryJobDataDto } from "@meepen/poe-accountant-api-schema";
import type { Item, StashTab } from "@meepen/poe-common";
import { StaticTradeDataJob } from "../static-trade-data.job.js";
import { db } from "../../connections/db.js";

enum ItemType {
  Currency = "Currency",
}

const ItemTypePricers = new Map<
  ItemType,
  (
    league: InferSelectModel<typeof League>,
    items: { item: Item; stash: StashTab }[],
  ) => Promise<SyncUserInventoryJobDataDto>
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
        applicableItems.map((entry) => entry.staticInfo.id),
      );

      if (lookupSet.size === 0) {
        return {};
      }

      // Retrieve different currency data
      const currencyData = await db.query.CurrencyExchangeHistory.findMany({
        where: (history, { and, eq, isNull }) =>
          and(
            eq(history.realm, league.realm),
            eq(history.leagueId, league.leagueId),
            isNull(history.nextTimestamp), // Only get latest
          ),
        with: {
          snapshotData: {
            where: (data, { inArray }) =>
              inArray(data.currency, Array.from(lookupSet)),
          },
        },
      });

      const snapshotData = currencyData
        .flatMap((history) => history.snapshotData)
        .reduce((map, data) => {
          map.set(data.currency, data);
          return map;
        }, new Map<string, (typeof currencyData)[number]["snapshotData"][number]>());

      return applicableItems.reduce<SyncUserInventoryJobDataDto>(
        (result, history) => {
          const matchingData = snapshotData.get(history.staticInfo.id);
          if (!matchingData) {
            return result;
          }

          const value =
            Number(matchingData.valuedAt) * (history.item.stackSize ?? 1);
          if (Number.isNaN(value)) {
            return result;
          }

          if (!(history.staticInfo.text in result)) {
            result[history.staticInfo.text] = [];
          }

          result[history.staticInfo.text].push({
            count: history.item.stackSize ?? 1,
            value,
            location: history.stash.name,
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

  const stashList = await api.listStashes({
    league: league.leagueId,
    realm: league.realm,
  });

  const collapsedItems = stashList.stashes.flatMap(
    (stash) =>
      stash.items?.map((item) => ({
        item,
        stash,
      })) ?? [],
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

  const results = await Promise.all(
    Array.from(ItemTypePricers.entries()).map(async ([itemType, pricer]) => {
      if (!(itemType in categorizedItems)) {
        return {};
      }
      return pricer(league, categorizedItems[itemType] ?? []);
    }),
  );

  return results.reduce((acc, result) => {
    for (const [key, value] of Object.entries(result)) {
      if (!(key in acc)) {
        acc[key] = [];
      }
      acc[key].push(...value);
    }
    return acc;
  }, {});
}
