import type {
  UserJobDto,
  MailboxQueue,
} from "@meepen/poe-accountant-api-schema";
import {
  MailboxQueueName,
  UserJobRedisMetadataTtlSeconds,
} from "@meepen/poe-accountant-api-schema";
import { createMiddleware } from "hono/factory";
import type { z } from "zod";
import type { AppEnv } from "../bindings";
import type { Valkey, ValkeyEnv } from "./valkey";
import type { SessionUserEnv } from "./session-user";

export function getUserJobCacheKey(userId: string, cacheKey: string): string {
  return `user:${userId}:job-cache:${cacheKey}`;
}

type CreateCachedUserJobOptions = {
  redis: Valkey;
  /**
   * Optional key to allow caching of different types of jobs. If not provided, will default to a random uuid.
   */
  cacheKey?: string;
  mailboxData: z.infer<typeof MailboxQueue>["data"];
  priority?: number;
};

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
  schema: z.ZodType<UserJobDto>,
  cacheKey: string,
  ttl = UserJobRedisMetadataTtlSeconds,
) =>
  createMiddleware<AppEnv & ValkeyEnv & SessionUserEnv>(async (c, next) => {
    const redis = c.get("valkey");
    const sessionUser = c.get("sessionUser");
    const key = getUserJobCacheKey(sessionUser.id, cacheKey);

    const previousJob = await redis.get<string>(key);

    if (previousJob) {
      return c.json(JSON.parse(previousJob));
    }

    await next();

    if (c.res.status >= 200 && c.res.status < 300) {
      const responseBody = await c.res.clone().text();
      await redis.set(key, JSON.stringify(responseBody), {
        ex: ttl,
      });
    }
  });
