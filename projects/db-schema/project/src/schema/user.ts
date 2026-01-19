import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const User = pgTable("user", {
  // 'sub' from oauth
  id: uuid("id").primaryKey(),

  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
  })
    .notNull()
    .defaultNow(),
  // From Path of Exile oauth:
  username: text("username").notNull(),

  scope: text("scope").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
});
