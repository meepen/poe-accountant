import { z } from "zod";
import { QueueWorker } from "./queue-worker.abstract.js";
import {
  UserLeagueSyncMessage,
  UserLeagueSyncMessageQueue,
} from "@meepen/poe-accountant-api-schema/queues/user-league-sync.message";
import { UserPoeApi } from "../connections/user-poe-api.js";
import { db } from "../connections/db.js";
import { League, UserLeagues } from "@meepen/poe-accountant-db-schema";
import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";

const realms = ["pc", "xbox", "sony"] as const;

export class SyncUserLeaguesJob extends QueueWorker<
  typeof UserLeagueSyncMessage
> {
  protected override readonly schema = UserLeagueSyncMessage;
  protected override readonly returnSchema = z.void();
  protected override readonly queueName = UserLeagueSyncMessageQueue;

  protected override async processJob(
    data: z.infer<typeof UserLeagueSyncMessage>,
  ): Promise<void> {
    const user = await db.query.User.findFirst({
      where: (userTable, { eq: equals }) => equals(userTable.id, data.userId),
    });
    if (!user) {
      throw new Error(`User '${data.userId}' not found for league sync.`);
    }
    const api = UserPoeApi.getOrCreate(user.id, user.accessToken, user.scope);

    const allLeagues = await Promise.all(
      realms.map((realm) => api.getLeagues({ realm })),
    );
    const leagues = allLeagues.flatMap((response) => response.leagues);

    // Insert new leagues into the generic league table, then associate them with the user

    await db.transaction(async (tx) => {
      console.log(
        `Syncing leagues for user ${data.userId}. Found ${leagues.length} leagues across all realms.`,
      );
      const dbLeagues = await tx
        .insert(League)
        .values(
          leagues.map<InferSelectModel<typeof League>>((league) => ({
            id: crypto.randomUUID(),
            leagueId: league.id,
            realm: league.realm ?? "pc",
            leagueName: league.name ?? league.id,
            startDate: league.startAt ? new Date(league.startAt) : null,
            endDate: league.endAt ? new Date(league.endAt) : null,
            rules: league.rules?.map((rule) => rule.id) ?? [],
          })),
        )
        .onConflictDoUpdate({
          set: {
            leagueName: sql`EXCLUDED.league_name`,
            startDate: sql`EXCLUDED.start_date`,
            endDate: sql`EXCLUDED.end_date`,
            rules: sql`EXCLUDED.rules`,
          },
          target: [League.leagueId, League.realm],
        })
        .returning();

      console.log(
        `Inserted/updated ${dbLeagues.length} leagues for user ${data.userId}.`,
      );

      await tx
        .insert(UserLeagues)
        .values(
          dbLeagues.map((league) => ({
            id: crypto.randomUUID(),
            userId: data.userId,
            leagueId: league.id,
          })),
        )
        .onConflictDoNothing();
    });
  }
}
