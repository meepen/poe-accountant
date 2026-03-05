import {
  ApiEndpoint,
  ApiEndpointMethods,
} from "@meepen/poe-accountant-api-schema/api/api-endpoints.enum";
import type { ApiResponse } from "@meepen/poe-accountant-api-schema/api/api-request-data.dto";
import { Hono } from "hono";
import type { z } from "zod";
import type { SyncUserInventoryResponseDto } from "@meepen/poe-accountant-api-schema";
import {
  InventorySyncMessageQueue,
  UserInventorySnapshotDetailDto,
  UserInventorySnapshotsPageDto,
  getUserJobCachePattern,
  getUserJobCacheKey,
} from "@meepen/poe-accountant-api-schema";
import {
  CurrencyExchangeHistory,
  CurrencyExchangeLeagueSnapshotData,
  type UserInventorySnapshot,
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

ApiEndpoint.GetUser satisfies "user";
ApiEndpointMethods[ApiEndpoint.GetUser] satisfies "GET";
user.get("/", (c) => {
  const user = c.get("sessionUser");

  return c.json(user);
});

ApiEndpoint.GetUserJobs satisfies "user/jobs";
ApiEndpointMethods[ApiEndpoint.GetUserJobs] satisfies "GET";
user.get("/jobs", requireSessionUser, async (c) => {
  const sessionUser = c.get("sessionUser");

  const keys = await c
    .get("valkey")
    .keys(getUserJobCachePattern(sessionUser.id));

  const jobs = keys.map((key) => key.split(":").at(-1));

  return c.json(jobs);
});

ApiEndpoint.GetUserJobResult satisfies "user/job/:jobId";
ApiEndpointMethods[ApiEndpoint.GetUserJobResult] satisfies "GET";
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

ApiEndpointMethods[ApiEndpoint.GetUserInventorySnapshots] satisfies "GET";
ApiEndpoint.GetUserInventorySnapshots satisfies "user/:realm/:leagueId/inventory-snapshots";
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
  } satisfies ApiResponse<ApiEndpoint.GetUserInventorySnapshots>;

  return c.json(UserInventorySnapshotsPageDto.parse(response));
});

ApiEndpoint.GetUserInventorySnapshot satisfies "user/:realm/:leagueId/inventory-snapshots/:snapshotId";
ApiEndpointMethods[ApiEndpoint.GetUserInventorySnapshot] satisfies "GET";
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
  } satisfies ApiResponse<ApiEndpoint.GetUserInventorySnapshot>;

  return c.json(UserInventorySnapshotDetailDto.parse(response));
});

ApiEndpoint.GetUserInventorySnapshotData satisfies "user/:realm/:leagueId/inventory-snapshots/:snapshotId/data";
ApiEndpointMethods[ApiEndpoint.GetUserInventorySnapshotData] satisfies "GET";
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

    const responseData =
      (await response.json()) satisfies ApiResponse<ApiEndpoint.GetUserInventorySnapshotData>;

    return c.json(responseData);
  },
);

ApiEndpoint.GetUserInventorySnapshotCurrencyList satisfies "user/:realm/:leagueId/inventory-snapshots/:snapshotId/currency-list";
ApiEndpointMethods[
  ApiEndpoint.GetUserInventorySnapshotCurrencyList
] satisfies "GET";
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

ApiEndpoint.SyncUserInventory satisfies "user/:realm/:leagueId/sync-inventory";
ApiEndpointMethods[ApiEndpoint.SyncUserInventory] satisfies "POST";
user.post(
  "/:realm/:leagueId/sync-inventory",
  requireUserRecord,
  createCachedJobMiddleware((params: Record<string, string>) => {
    const realm = params.realm;
    const leagueId = params.leagueId;
    return `${ApiEndpoint.SyncUserInventory}:${realm}:${leagueId}`;
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

ApiEndpoint.GetUserLeagues satisfies "user/leagues";
ApiEndpointMethods[ApiEndpoint.GetUserLeagues] satisfies "GET";
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
    userLeagues.map<ApiResponse<ApiEndpoint.GetUserLeagues>[number]>(
      (userLeague) => ({
        id: userLeague.id,
        leagueName: userLeague.league.leagueName,
        leagueId: userLeague.league.leagueId,
        realm: userLeague.league.realm,
        startDate: userLeague.league.startDate?.toISOString() ?? null,
        endDate: userLeague.league.endDate?.toISOString() ?? null,
      }),
    ),
  );
});
