import {
  bigint,
  decimal,
  doublePrecision,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { League } from "./league.js";
import { relations } from "drizzle-orm/relations";

export const CurrencyExchangeHistory = pgTable(
  "currency_exchange_history",
  {
    id: uuid("id").notNull().unique(),

    realm: text("realm").notNull(),
    leagueId: text("league_id").notNull(),

    timestamp: timestamp("timestamp", {
      mode: "date",
      withTimezone: true,
    }).notNull(),

    nextTimestamp: timestamp("next_timestamp", {
      mode: "date",
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.realm, t.leagueId, t.timestamp] }),
    index("idx_currency_exchange_history_timestamp").on(t.timestamp),
    index("idx_currency_exchange_history_league").on(t.leagueId),
  ],
);

export const CurrencyExchangeHistoryCurrency = pgTable(
  "currency_exchange_league_currency",
  {
    id: uuid("id").notNull().primaryKey(),
    historyId: uuid("history_id")
      .notNull()
      .references(() => CurrencyExchangeHistory.id, {
        onDelete: "cascade",
      }),
    fromCurrency: text("from_currency").notNull(),
    toCurrency: text("to_currency").notNull(),
    fromVolume: bigint("from_volume", { mode: "bigint" }).notNull(),
    toVolume: bigint("to_volume", { mode: "bigint" }).notNull(),
    lowestRatio: doublePrecision("lowest_ratio").notNull(),
    highestRatio: doublePrecision("highest_ratio").notNull(),
  },
  (t) => [
    index("idx_currency_exchange_league_currency_history_id").on(t.historyId),
    index("idx_currency_exchange_league_currency_from_currency").on(
      t.fromCurrency,
    ),
    index("idx_currency_exchange_league_currency_to_currency").on(t.toCurrency),
    unique(
      "currency_exchange_league_currency_history_id_from_currency_to_currency_unique",
    ).on(t.historyId, t.fromCurrency, t.toCurrency),
  ],
);

export const CurrencyExchangeLeagueRelations = relations(
  CurrencyExchangeHistory,
  ({ one, many }) => ({
    league: one(League, {
      fields: [CurrencyExchangeHistory.realm, CurrencyExchangeHistory.leagueId],
      references: [League.realm, League.leagueId],
    }),
    currencies: many(CurrencyExchangeHistoryCurrency),
  }),
);

export const CurrencyExchangeHistoryCurrencyRelations = relations(
  CurrencyExchangeHistoryCurrency,
  ({ one }) => ({
    history: one(CurrencyExchangeHistory, {
      fields: [CurrencyExchangeHistoryCurrency.historyId],
      references: [CurrencyExchangeHistory.id],
    }),
  }),
);

export const LeagueRelations = relations(League, ({ many }) => ({
  currencyExchangeHistories: many(CurrencyExchangeHistory),
}));

export const CurrencyExchangeLeagueSnapshotData = pgTable(
  "currency_exchange_league_snapshot_data",
  {
    historyId: uuid("history_id")
      .notNull()
      .references(() => CurrencyExchangeHistory.id, {
        onDelete: "cascade",
      }),
    currency: text("currency").notNull(), // The item being valued

    // 1. The Calculated Value (from RateResult.optimalRate)
    valuedAt: decimal("valued_at", { precision: 30, scale: 10 }).notNull(),
    stableCurrency: text("stable_currency").notNull(), // e.g. "chaos"

    directMarketRate: decimal("direct_market_rate", {
      precision: 30,
      scale: 10,
    }),

    confidenceScore: doublePrecision("confidence_score").notNull(),
    liquidity: bigint("liquidity", { mode: "bigint" }).notNull(),
    dataStaleness: timestamp("data_staleness", {
      mode: "date",
      withTimezone: true,
    }).notNull(),

    calculationPath: jsonb("calculation_path").$type<string[]>().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.historyId, t.currency, t.stableCurrency] }),
    index("idx_currency_exchange_league_snapshot_data_history_id").on(
      t.historyId,
    ),
    index("idx_currency_exchange_league_snapshot_data_currency").on(t.currency),
  ],
);

export const CurrencyExchangeLeagueSnapshotDataRelations = relations(
  CurrencyExchangeLeagueSnapshotData,
  ({ one }) => ({
    league: one(CurrencyExchangeHistory, {
      fields: [CurrencyExchangeLeagueSnapshotData.historyId],
      references: [CurrencyExchangeHistory.id],
    }),
  }),
);
