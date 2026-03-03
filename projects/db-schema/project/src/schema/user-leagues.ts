import { pgTable, unique, uuid } from "drizzle-orm/pg-core";
import { User } from "./user.js";
import { League } from "./league.js";
import { relations } from "drizzle-orm";

export const UserLeagues = pgTable(
  "user_leagues",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .references(() => User.id, { onDelete: "cascade" })
      .notNull(),
    leagueId: uuid("league_id")
      .references(() => League.id, {
        onDelete: "cascade",
      })
      .notNull(),
  },
  (t) => [
    unique("unq_user_leagues_user_id_league_id").on(t.userId, t.leagueId),
  ],
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
