import { pgTable, uuid } from "drizzle-orm/pg-core";
import { User } from "./user.js";
import { relations } from "drizzle-orm";

export const UserSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => User.id, { onDelete: "cascade" }),
});

export const UserSettingsReference = relations(UserSettings, ({ one }) => ({
  user: one(User, {
    fields: [UserSettings.userId],
    references: [User.id],
  }),
}));

export const UserSettingsReferences = relations(User, ({ one }) => ({
  settings: one(UserSettings, {
    fields: [User.id],
    references: [UserSettings.userId],
  }),
}));
