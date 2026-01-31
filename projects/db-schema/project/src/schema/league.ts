import {
  pgTable,
  timestamp,
  text,
  uuid,
  primaryKey,
} from "drizzle-orm/pg-core";

export const League = pgTable(
  "league",
  {
    id: uuid("id").notNull().unique(),
    leagueId: text("league_id").notNull(),
    leagueName: text("league_name"),
    realm: text("realm").notNull(),
    startDate: timestamp("start_date", {
      mode: "date",
      withTimezone: true,
    }),
    endDate: timestamp("end_date", {
      mode: "date",
      withTimezone: true,
    }),
  },
  (t) => [primaryKey({ columns: [t.realm, t.leagueId] })],
);
