import { getCookie } from "hono/cookie";
import type { AppEnv } from "../bindings";
import type { Database } from "../middleware/db";
import { User } from "@meepen/poe-accountant-db-schema/user";
import type { InferSelectModel } from "drizzle-orm/table";
import type { Redis } from "@upstash/redis";
import type { z } from "zod";
import type { UserDto } from "@meepen/poe-accountant-api-schema/api/dtos/user/user.dto";
import { sessionCookieName } from "@meepen/poe-accountant-api-schema/api/dtos/user/user.dto";
import type { Context } from "hono";

export async function getUser(
  db: Database,
  userId: string,
): Promise<InferSelectModel<typeof User> | null> {
  const user = await db.query.User.findFirst({
    where: (user, { eq }) => eq(user.id, userId),
  });

  if (!user) {
    return null;
  }

  return user;
}

const valkeySessionPrefix = "session:";

export async function getSessionUser<C extends AppEnv>(
  redis: Redis,
  c: Context<C>,
): Promise<z.infer<typeof UserDto> | null> {
  const cookie = getCookie(c, sessionCookieName);
  if (!cookie) {
    return null;
  }

  const userDto = await redis.get<z.infer<typeof UserDto>>(
    `${valkeySessionPrefix}${cookie}`,
  );

  return userDto;
}

export async function createSession(
  redis: Redis,
  userDto: z.infer<typeof UserDto>,
) {
  await redis.set(
    `${valkeySessionPrefix}${userDto.authorizationToken}`,
    userDto,
    {
      ex: Math.floor(
        (new Date(userDto.expiresAt).getTime() - Date.now()) / 1000,
      ),
    },
  );

  return userDto;
}

export async function createOrUpdateUser(
  db: Database,
  userData: Omit<InferSelectModel<typeof User>, "createdAt" | "updatedAt">,
): Promise<InferSelectModel<typeof User>> {
  const user = await db
    .insert(User)
    .values({
      ...userData,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: User.id,
      set: {
        ...userData,
        updatedAt: new Date(),
      },
    })
    .returning();

  return user[0];
}
