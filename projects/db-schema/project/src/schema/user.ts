import { pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const User = pgTable("user", {
  id: uuid("id").primaryKey(), // 'sub' from Path of Exile oauth

  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
  }).defaultNow(),
  username: serial("username").notNull(), // From Path of Exile oauth

  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
});
