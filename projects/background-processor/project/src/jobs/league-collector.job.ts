import { z } from "zod";
import { QueueScheduler } from "./queue-scheduler.abstract.js";
import { appApi, realms } from "../connections/poe-api.js";
import { db } from "../connections/db.js";
import { League } from "@meepen/poe-accountant-db-schema";
import { InferSelectModel, sql } from "drizzle-orm";

const LeagueCollectorJobQueueName = "league-collector-job-queue";
const LeagueCollectorJobSchema = z.object({});

export class LeagueCollectorJob extends QueueScheduler<
  typeof LeagueCollectorJobSchema
> {
  protected override readonly returnSchema = z.void();
  protected override readonly queueName = LeagueCollectorJobQueueName;
  protected override readonly schema = LeagueCollectorJobSchema;
  protected override readonly queueData = {};

  protected override readonly cron = "0 */6 * * *";

  protected async processJob(): Promise<void> {
    await Promise.all(
      realms.map((realm) => LeagueCollectorJob.collectAllLeagues(realm)),
    );
  }

  public static async collectAllLeagues(realm: string) {
    const limit = 50;
    for (let offset = 0; ; offset += limit) {
      const leagues = await appApi.listLeagues({
        realm,
        limit: String(limit),
        offset: String(offset),
      });

      await db
        .insert(League)
        .values(
          leagues.leagues.map<InferSelectModel<typeof League>>((league) => ({
            id: crypto.randomUUID(),
            leagueId: league.id,
            leagueName: league.name ?? null,
            realm,
            startDate: league.startAt ? new Date(league.startAt) : null,
            endDate: league.endAt ? new Date(league.endAt) : null,
          })),
        )
        .onConflictDoUpdate({
          set: {
            startDate: sql`excluded.start_date`,
            endDate: sql`excluded.end_date`,
            leagueName: sql`excluded.league_name`,
          },
          target: [League.realm, League.leagueId],
        })
        .execute();

      if (leagues.leagues.length < limit) {
        break;
      }
    }
  }
}
