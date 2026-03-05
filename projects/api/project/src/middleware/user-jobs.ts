import type { MailboxQueue } from "@meepen/poe-accountant-api-schema";
import {
  getUserJobCacheKey,
  MailboxQueueName,
  UserJobRedisMetadataTtlSeconds,
} from "@meepen/poe-accountant-api-schema";
import { createMiddleware } from "hono/factory";
import type { z } from "zod";
import type { AppEnv } from "../bindings";
import type { Valkey, ValkeyEnv } from "./valkey";
import type { SessionUserEnv } from "./session-user";

type CreateCachedUserJobOptions = {
  redis: Valkey;
  /**
   * Optional key to allow caching of different types of jobs. If not provided, will default to a random uuid.
   */
  cacheKey?: string;
  mailboxData: z.infer<typeof MailboxQueue>["data"];
  priority?: number;
};

export type CachedJobMiddlewareEnv = {
  Variables: {
    cachedJobCacheKey: string;
    cachedJobRedisKey: string;
  };
};

function normalizeRouteParams(params: unknown): Record<string, string> {
  if (!params || typeof params !== "object") {
    return {};
  }

  return Object.entries(params).reduce<Record<string, string>>(
    (result, [key, value]) => {
      if (typeof value === "string") {
        result[key] = value;
      }
      return result;
    },
    {},
  );
}

export async function startUserJob({
  redis,
  mailboxData,
  priority = 100,
}: CreateCachedUserJobOptions) {
  await redis.rpush(
    MailboxQueueName,
    JSON.stringify({
      messageId: crypto.randomUUID(),
      data: mailboxData,
      priority,
    } satisfies z.infer<typeof MailboxQueue>),
  );
}

export const createCachedJobMiddleware = (
  cacheKey: string | ((params: Record<string, string>) => string),
  ttl = UserJobRedisMetadataTtlSeconds,
) =>
  createMiddleware<
    AppEnv & ValkeyEnv & SessionUserEnv & CachedJobMiddlewareEnv
  >(async (c, next) => {
    const redis = c.get("valkey");
    const sessionUser = c.get("sessionUser");
    const routeParams = normalizeRouteParams(c.req.param());
    const resolvedCacheKey =
      typeof cacheKey === "function" ? cacheKey(routeParams) : cacheKey;
    const key = getUserJobCacheKey(sessionUser.id, resolvedCacheKey);

    c.set("cachedJobCacheKey", resolvedCacheKey);
    c.set("cachedJobRedisKey", key);

    const previousJob = await redis.get<object>(key);

    if (previousJob) {
      return c.json(previousJob);
    }

    await next();

    if (c.res.status >= 200 && c.res.status < 300) {
      const responseBody = await c.res.clone().json();
      await redis.set(key, responseBody, {
        ex: ttl,
      });
    }
  });
