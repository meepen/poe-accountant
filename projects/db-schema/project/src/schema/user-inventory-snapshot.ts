import {
  decimal,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { User } from "./user.js";
import { League } from "./league.js";

export const UserInventorySnapshot = pgTable(
  "user_inventory_snapshot",
  {
    id: uuid("id").notNull().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => User.id, { onDelete: "cascade" }),
    realm: text("realm").notNull(),
    leagueId: text("league_id").notNull(),
    generatedAt: timestamp("generated_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    r2ObjectKey: text("r2_object_key").notNull().unique(),
    totalValue: decimal("total_value", { precision: 30, scale: 10 }).notNull(),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.realm, t.leagueId],
      foreignColumns: [League.realm, League.leagueId],
      name: "user_inventory_snapshot_league_fk",
    }),
    index("idx_user_inventory_snapshot_user_generated_at").on(
      t.userId,
      t.generatedAt,
    ),
    index("idx_user_inventory_snapshot_league").on(t.realm, t.leagueId),
  ],
);

export const UserInventorySnapshotRelations = relations(
  UserInventorySnapshot,
  ({ one }) => ({
    user: one(User, {
      fields: [UserInventorySnapshot.userId],
      references: [User.id],
    }),
    league: one(League, {
      fields: [UserInventorySnapshot.realm, UserInventorySnapshot.leagueId],
      references: [League.realm, League.leagueId],
    }),
  }),
);
