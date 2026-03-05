import { ApiEndpoint } from "@meepen/poe-accountant-api-schema/api/api-endpoints";
import { Hono } from "hono";
import type { z } from "zod";
import type { SyncUserInventoryResponseDto } from "@meepen/poe-accountant-api-schema";
import {
  InventorySyncMessageQueue,
  UpdateUserSettingsDto,
  UserInventorySnapshotDetailDto,
  UserInventorySnapshotsPageDto,
  UserSettingsDto,
  getUserJobCachePattern,
  getUserJobCacheKey,
} from "@meepen/poe-accountant-api-schema";
import {
  CurrencyExchangeHistory,
  CurrencyExchangeLeagueSnapshotData,
  type UserInventorySnapshot,
  UserSettings,
} from "@meepen/poe-accountant-db-schema";
import { and, desc, eq, gte, lte, lt } from "drizzle-orm";
import type { SessionUserEnv } from "../middleware/session-user";
import { requireSessionUser } from "../middleware/session-user";
import { requireUserRecord } from "../middleware/user-record";
import {
  createCachedJobMiddleware,
  startUserJob,
} from "../middleware/user-jobs";
import type { IndexEnv } from "..";
import { createMiddleware } from "hono/factory";
import { UserLeagueSyncMessageQueue } from "@meepen/poe-accountant-api-schema/queues/user-league-sync.message";
import { zValidator } from "@hono/zod-validator";

function getUserUpdateKey(userId: string) {
  return `user-update:${userId}`;
}

export const user = new Hono<IndexEnv>().use("*", requireSessionUser).use(
  "*",
  createMiddleware<SessionUserEnv & IndexEnv>(async (c, next) => {
    // This middleware submits updates for users every 30 minutes to keep their data fresh when they use the site.
    const sessionUser = c.get("sessionUser");
    const redis = c.get("valkey");
    const result = await redis.set(
      getUserUpdateKey(sessionUser.id),
      Date.now().toString(),
      {
        ex: 60 * 30, // 30 minutes
        nx: true, // Only set if not exists to avoid resetting the timer on every request
      },
    );
    if (result) {
      // If the key was set, it means it's the first update in the last 30 minutes, so we trigger a league sync for the user.
      await startUserJob({
        redis,
        mailboxData: {
          targetQueue: UserLeagueSyncMessageQueue,
          message: {
            userId: sessionUser.id,
          },
        },
        priority: 50, // Higher priority than normal jobs to ensure user data is updated quickly
      });
    }
    await next();

    if (result) {
      c.res.headers.set("X-User-Update-Triggered", "1");
    }
  }),
);

function toSnapshotResponse(
  snapshot: typeof UserInventorySnapshot.$inferSelect,
) {
  return {
    id: snapshot.id,
    realm: snapshot.realm,
    leagueId: snapshot.leagueId,
    generatedAt: snapshot.generatedAt.toISOString(),
    totalValue: snapshot.totalValue,
  };
}

ApiEndpoint.GetUser satisfies { path: "user"; method: "GET" };
user.get("/", (c) => {
  const user = c.get("sessionUser");

  return c.json(user);
});

ApiEndpoint.GetUserSettings satisfies { path: "user/settings"; method: "GET" };
user.get("/settings", async (c) => {
  const sessionUser = c.get("sessionUser");
  const db = c.get("db");

  const userSettings = await db.query.UserSettings.findFirst({
    where: (settings, { eq: equals }) =>
      equals(settings.userId, sessionUser.id),
  });

  return c.json(
    UserSettingsDto.parse({
      currentLeagueId: userSettings?.currentLeagueId ?? null,
    }),
  );
});

ApiEndpoint.UpdateUserSettings satisfies {
  path: "user/settings";
  method: "PATCH";
};
user.patch(
  "/settings",
  zValidator("json", UpdateUserSettingsDto),
  async (c) => {
    const sessionUser = c.get("sessionUser");
    const db = c.get("db");
    const patch = c.req.valid("json");

    const currentLeagueId = patch.currentLeagueId;

    if (currentLeagueId === undefined) {
      const userSettings = await db.query.UserSettings.findFirst({
        where: (settings, { eq: equals }) =>
          equals(settings.userId, sessionUser.id),
      });

      return c.json(
        UserSettingsDto.parse({
          currentLeagueId: userSettings?.currentLeagueId ?? null,
        }),
      );
    }

    if (currentLeagueId !== null) {
      const userLeague = await db.query.UserLeagues.findFirst({
        where: (userLeague, { and: andWhere, eq: equals }) =>
          andWhere(
            equals(userLeague.id, currentLeagueId),
            equals(userLeague.userId, sessionUser.id),
          ),
      });

      if (!userLeague) {
        return c.json({ error: "Current league not found for user" }, 400);
      }
    }

    const [updatedSettings] = await db
      .insert(UserSettings)
      .values({
        userId: sessionUser.id,
        currentLeagueId,
      })
      .onConflictDoUpdate({
        target: UserSettings.userId,
        set: {
          currentLeagueId,
        },
      })
      .returning({
        currentLeagueId: UserSettings.currentLeagueId,
      });

    return c.json(
      UserSettingsDto.parse({
        currentLeagueId: updatedSettings.currentLeagueId,
      }),
    );
  },
);

ApiEndpoint.GetUserJobs satisfies { path: "user/jobs"; method: "GET" };
user.get("/jobs", requireSessionUser, async (c) => {
  const sessionUser = c.get("sessionUser");

  const keys = await c
    .get("valkey")
    .keys(getUserJobCachePattern(sessionUser.id));

  const jobs = keys.map((key) => key.split(":").at(-1));

  return c.json(jobs);
});

ApiEndpoint.GetUserJobResult satisfies {
  path: "user/job/:jobId";
  method: "GET";
};
user.get("/job/:jobId", async (c) => {
  const sessionUser = c.get("sessionUser");
  const redis = c.get("valkey");
  const key = getUserJobCacheKey(sessionUser.id, c.req.param("jobId"));
  const returnRaw = await redis.get(key);
  if (!returnRaw) {
    return c.json({ error: "Job not found" }, 404);
  }

  return c.json(
    typeof returnRaw === "string" ? JSON.parse(returnRaw) : returnRaw,
  );
});

ApiEndpoint.GetUserInventorySnapshots satisfies {
  path: "user/:realm/:leagueId/inventory-snapshots";
  method: "GET";
};
user.get("/:realm/:leagueId/inventory-snapshots", async (c) => {
  const twoWeekPeriodMs = 14 * 24 * 60 * 60 * 1000;
  const sessionUser = c.get("sessionUser");
  const db = c.get("db");
  const { realm, leagueId } = c.req.param();
  const pageParam = c.req.query("page");
  const parsedPage = Number.parseInt(pageParam ?? "0", 10);
  const page = Number.isNaN(parsedPage) || parsedPage < 0 ? 0 : parsedPage;
  const periodEnd = new Date(Date.now() - page * twoWeekPeriodMs);
  const periodBeginning = new Date(periodEnd.getTime() - twoWeekPeriodMs);

  const snapshots = await db.query.UserInventorySnapshot.findMany({
    where: (snapshot, { eq: equals, and }) =>
      and(
        equals(snapshot.userId, sessionUser.id),
        equals(snapshot.realm, realm),
        equals(snapshot.leagueId, leagueId),
        gte(snapshot.generatedAt, periodBeginning),
        lt(snapshot.generatedAt, periodEnd),
      ),
    orderBy: (snapshotTable, { desc: orderDesc }) => [
      orderDesc(snapshotTable.generatedAt),
    ],
  });

  const response = {
    page,
    beginningTime: periodBeginning.toISOString(),
    endTime: periodEnd.toISOString(),
    snapshots: snapshots.map(toSnapshotResponse),
  } satisfies z.infer<
    (typeof ApiEndpoint.GetUserInventorySnapshots)["outputSchema"]
  >;

  return c.json(UserInventorySnapshotsPageDto.parse(response));
});

ApiEndpoint.GetUserInventorySnapshot satisfies {
  path: "user/:realm/:leagueId/inventory-snapshots/:snapshotId";
  method: "GET";
};
user.get("/:realm/:leagueId/inventory-snapshots/:snapshotId", async (c) => {
  const sessionUser = c.get("sessionUser");
  const db = c.get("db");
  const snapshotId = c.req.param("snapshotId");
  const { realm, leagueId } = c.req.param();

  const snapshot = await db.query.UserInventorySnapshot.findFirst({
    where: (snapshotTable) =>
      and(
        eq(snapshotTable.id, snapshotId),
        eq(snapshotTable.userId, sessionUser.id),
        eq(snapshotTable.realm, realm),
        eq(snapshotTable.leagueId, leagueId),
      ),
  });

  if (!snapshot) {
    return c.notFound();
  }

  const response = {
    ...toSnapshotResponse(snapshot),
    r2ObjectKey: snapshot.r2ObjectKey,
  } satisfies z.infer<
    (typeof ApiEndpoint.GetUserInventorySnapshot)["outputSchema"]
  >;

  return c.json(UserInventorySnapshotDetailDto.parse(response));
});

ApiEndpoint.GetUserInventorySnapshotData satisfies {
  path: "user/:realm/:leagueId/inventory-snapshots/:snapshotId/data";
  method: "GET";
};
user.get(
  "/:realm/:leagueId/inventory-snapshots/:snapshotId/data",
  async (c) => {
    const sessionUser = c.get("sessionUser");
    const db = c.get("db");
    const snapshotId = c.req.param("snapshotId");
    const { realm, leagueId } = c.req.param();

    const snapshot = await db.query.UserInventorySnapshot.findFirst({
      where: (snapshotTable) =>
        and(
          eq(snapshotTable.id, snapshotId),
          eq(snapshotTable.userId, sessionUser.id),
          eq(snapshotTable.realm, realm),
          eq(snapshotTable.leagueId, leagueId),
        ),
    });

    if (!snapshot) {
      return c.notFound();
    }

    const s3 = c.get("s3");

    const response = await s3.get(snapshot.r2ObjectKey);
    if (!response.ok) {
      return c.json({ error: "Failed to fetch snapshot data" }, 502);
    }

    const responseData = (await response.json()) satisfies z.infer<
      (typeof ApiEndpoint.GetUserInventorySnapshotData)["outputSchema"]
    >;

    return c.json(responseData);
  },
);

ApiEndpoint.GetUserInventorySnapshotCurrencyList satisfies {
  path: "user/:realm/:leagueId/inventory-snapshots/:snapshotId/currency-list";
  method: "GET";
};
user.get(
  "/:realm/:leagueId/inventory-snapshots/:snapshotId/currency-list",
  async (c) => {
    const sessionUser = c.get("sessionUser");
    const db = c.get("db");
    const snapshotId = c.req.param("snapshotId");
    const { realm, leagueId } = c.req.param();

    const snapshot = await db.query.UserInventorySnapshot.findFirst({
      where: (snapshotTable) =>
        and(
          eq(snapshotTable.id, snapshotId),
          eq(snapshotTable.userId, sessionUser.id),
          eq(snapshotTable.realm, realm),
          eq(snapshotTable.leagueId, leagueId),
        ),
    });

    if (!snapshot) {
      return c.notFound();
    }

    const rates = await db
      .selectDistinctOn([CurrencyExchangeLeagueSnapshotData.currency], {
        currency: CurrencyExchangeLeagueSnapshotData.currency,
        value: CurrencyExchangeLeagueSnapshotData.valuedAt,
        stableCurrency: CurrencyExchangeLeagueSnapshotData.stableCurrency,
        confidenceScore: CurrencyExchangeLeagueSnapshotData.confidenceScore,
      })
      .from(CurrencyExchangeLeagueSnapshotData)
      .innerJoin(
        CurrencyExchangeHistory,
        eq(
          CurrencyExchangeLeagueSnapshotData.historyId,
          CurrencyExchangeHistory.id,
        ),
      )
      .where(() =>
        and(
          eq(CurrencyExchangeHistory.realm, realm),
          eq(CurrencyExchangeHistory.leagueId, leagueId),
          lte(CurrencyExchangeHistory.timestamp, snapshot.generatedAt),
        ),
      )
      .orderBy(
        CurrencyExchangeLeagueSnapshotData.currency,
        desc(CurrencyExchangeHistory.timestamp),
      );

    return c.json(
      rates.map((rate) => ({
        currency: rate.currency,
        confidenceScore: rate.confidenceScore,
        value: {
          currency: rate.stableCurrency,
          amount: rate.value,
        },
      })),
    );
  },
);

ApiEndpoint.SyncUserInventory satisfies {
  path: "user/:realm/:leagueId/sync-inventory";
  method: "POST";
};
user.post(
  "/:realm/:leagueId/sync-inventory",
  requireUserRecord,
  createCachedJobMiddleware((params: Record<string, string>) => {
    const realm = params.realm;
    const leagueId = params.leagueId;
    return `${ApiEndpoint.SyncUserInventory.path}:${realm}:${leagueId}`;
  }),
  async (c) => {
    const sessionUser = c.get("sessionUser");
    const redis = c.get("valkey");
    const { realm, leagueId } = c.req.param();
    const redisKey = c.get("cachedJobRedisKey");
    const cachedJobCacheKey = c.get("cachedJobCacheKey");

    await startUserJob({
      redis,
      cacheKey: cachedJobCacheKey,
      mailboxData: {
        targetQueue: InventorySyncMessageQueue,
        message: {
          jobId: cachedJobCacheKey,
          userId: sessionUser.id,
          redisKey,
          league: {
            id: leagueId,
            realm,
          },
        },
      },
    });

    const job = {
      id: cachedJobCacheKey,
      done: false,
      data: null,
    } satisfies z.infer<SyncUserInventoryResponseDto>;

    return c.json(job);
  },
);

ApiEndpoint.GetUserLeagues satisfies {
  path: "user/leagues";
  method: "GET";
};
user.get("/leagues", async (c) => {
  const sessionUser = c.get("sessionUser");
  const db = c.get("db");

  const userLeagues = await db.query.UserLeagues.findMany({
    where: (userLeague, { eq: equals }) =>
      equals(userLeague.userId, sessionUser.id),
    with: {
      league: true,
    },
  });

  return c.json(
    userLeagues.map<
      z.infer<(typeof ApiEndpoint.GetUserLeagues)["outputSchema"]>[number]
    >((userLeague) => ({
      id: userLeague.id,
      leagueName: userLeague.league.leagueName,
      leagueId: userLeague.league.leagueId,
      realm: userLeague.league.realm,
      startDate: userLeague.league.startDate?.toISOString() ?? null,
      endDate: userLeague.league.endDate?.toISOString() ?? null,
    })),
  );
});
