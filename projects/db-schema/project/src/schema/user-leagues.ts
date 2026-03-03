import { pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { User } from "./user.js";
import { League } from "./league.js";
import { relations } from "drizzle-orm";

export const UserLeagues = pgTable(
  "user_leagues",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => User.id, { onDelete: "cascade" }),
    leagueId: uuid("league_id").references(() => League.id, {
      onDelete: "cascade",
    }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.leagueId] })],
);

export const UserLeagueRelations = relations(UserLeagues, ({ one }) => ({
  user: one(User, {
    fields: [UserLeagues.userId],
    references: [User.id],
  }),
  league: one(League, {
    fields: [UserLeagues.leagueId],
    references: [League.id],
  }),
}));
