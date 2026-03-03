import {
  ApiEndpoint,
  ApiEndpointMethods,
} from "@meepen/poe-accountant-api-schema/api/api-endpoints.enum";
import type { ApiResponse } from "@meepen/poe-accountant-api-schema/api/api-request-data.dto";
import { Hono } from "hono";
import type { z } from "zod";
import {
  InventorySyncMessageQueue,
  SyncUserInventoryJobDataDto,
  SyncUserInventoryResponseDto,
  UserInventorySnapshotDetailDto,
  UserInventorySnapshotDto,
  getUserJobCachePattern,
  getUserJobCacheKey,
} from "@meepen/poe-accountant-api-schema";
import type { UserInventorySnapshot } from "@meepen/poe-accountant-db-schema";
import { and, eq } from "drizzle-orm";
import { requireSessionUser } from "../middleware/session-user";
import { requireUserRecord } from "../middleware/user-record";
import {
  createCachedJobMiddleware,
  startUserJob,
} from "../middleware/user-jobs";
import type { IndexEnv } from "..";

export const user = new Hono<IndexEnv>().use("*", requireSessionUser);

function toSnapshotResponse(
  snapshot: typeof UserInventorySnapshot.$inferSelect,
): ApiResponse<ApiEndpoint.GetUserInventorySnapshots>[number] {
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

ApiEndpoint.GetUserInventorySnapshots satisfies "user/inventory-snapshots";
ApiEndpointMethods[ApiEndpoint.GetUserInventorySnapshots] satisfies "GET";
user.get("/inventory-snapshots", async (c) => {
  const sessionUser = c.get("sessionUser");
  const db = c.get("db");

  const snapshots = await db.query.UserInventorySnapshot.findMany({
    where: (snapshot, { eq: equals }) =>
      equals(snapshot.userId, sessionUser.id),
    orderBy: (snapshotTable, { desc: orderDesc }) => [
      orderDesc(snapshotTable.generatedAt),
    ],
    limit: 50,
  });

  const response = snapshots.map(
    toSnapshotResponse,
  ) satisfies ApiResponse<ApiEndpoint.GetUserInventorySnapshots>;

  return c.json(UserInventorySnapshotDto.array().parse(response));
});

ApiEndpoint.GetUserInventorySnapshot satisfies "user/inventory-snapshots/:snapshotId";
ApiEndpointMethods[ApiEndpoint.GetUserInventorySnapshot] satisfies "GET";
user.get("/inventory-snapshots/:snapshotId", async (c) => {
  const sessionUser = c.get("sessionUser");
  const db = c.get("db");
  const snapshotId = c.req.param("snapshotId");

  const snapshot = await db.query.UserInventorySnapshot.findFirst({
    where: (snapshotTable) =>
      and(
        eq(snapshotTable.id, snapshotId),
        eq(snapshotTable.userId, sessionUser.id),
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

ApiEndpoint.GetUserInventorySnapshotData satisfies "user/inventory-snapshots/:snapshotId/data";
ApiEndpointMethods[ApiEndpoint.GetUserInventorySnapshotData] satisfies "GET";
user.get("/inventory-snapshots/:snapshotId/data", async (c) => {
  const sessionUser = c.get("sessionUser");
  const db = c.get("db");
  const snapshotId = c.req.param("snapshotId");

  const snapshot = await db.query.UserInventorySnapshot.findFirst({
    where: (snapshotTable) =>
      and(
        eq(snapshotTable.id, snapshotId),
        eq(snapshotTable.userId, sessionUser.id),
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

  const responseData = SyncUserInventoryJobDataDto.parse(
    await response.json(),
  ) satisfies ApiResponse<ApiEndpoint.GetUserInventorySnapshotData>;

  return c.json(responseData);
});

ApiEndpoint.SyncUserInventory satisfies "user/sync-inventory";
ApiEndpointMethods[ApiEndpoint.SyncUserInventory] satisfies "POST";
user.post(
  "/sync-inventory",
  requireUserRecord,
  createCachedJobMiddleware(
    SyncUserInventoryResponseDto,
    ApiEndpoint.SyncUserInventory,
  ),
  async (c) => {
    const sessionUser = c.get("sessionUser");
    const redis = c.get("valkey");
    const db = c.get("db");

    const activeLeague = await db.query.League.findFirst({
      where: (league, { isNotNull, and, gte, lte, or }) =>
        and(
          isNotNull(league.startDate),
          lte(league.startDate, new Date()),
          or(isNotNull(league.endDate), gte(league.endDate, new Date())),
        ),
      orderBy: (league, { desc: orderDesc }) => [orderDesc(league.startDate)],
    });

    if (!activeLeague) {
      return c.json({ error: "No active league available" }, 503);
    }

    const redisKey = getUserJobCacheKey(
      sessionUser.id,
      ApiEndpoint.SyncUserInventory,
    );

    await startUserJob({
      redis,
      cacheKey: ApiEndpoint.SyncUserInventory,
      mailboxData: {
        targetQueue: InventorySyncMessageQueue,
        message: {
          userId: sessionUser.id,
          redisKey,
          league: {
            id: activeLeague.leagueId,
            realm: activeLeague.realm,
          },
        },
      },
    });

    const job = {
      id: ApiEndpoint.SyncUserInventory,
      done: false,
      data: null,
    } satisfies z.infer<SyncUserInventoryResponseDto>;

    return c.json(job);
  },
);
