import { pgTable, uuid } from "drizzle-orm/pg-core";
import { User } from "./user.js";
import { relations } from "drizzle-orm";
import { UserLeagues } from "./user-leagues.js";

export const UserSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => User.id, { onDelete: "cascade" }),
  currentLeagueId: uuid("current_league_id").references(() => UserLeagues.id, {
    onDelete: "set null",
  }),
});

export const UserSettingsReference = relations(UserSettings, ({ one }) => ({
  user: one(User, {
    fields: [UserSettings.userId],
    references: [User.id],
  }),
  currentLeague: one(UserLeagues, {
    fields: [UserSettings.currentLeagueId],
    references: [UserLeagues.id],
  }),
}));

export const UserSettingsReferences = relations(User, ({ one }) => ({
  settings: one(UserSettings, {
    fields: [User.id],
    references: [UserSettings.userId],
  }),
}));
