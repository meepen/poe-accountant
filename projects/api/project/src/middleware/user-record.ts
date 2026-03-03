import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../bindings";
import { getUser } from "../db/user";
import type { SessionUserEnv } from "./session-user";
import type { DbEnv } from "./db";

export const requiredUserScopes = [
  "account:profile",
  "account:leagues",
  "account:stashes",
];

export type UserRecordEnv = {
  Variables: {
    userRecord: NonNullable<Awaited<ReturnType<typeof getUser>>>;
  };
};

export const requireUserRecord = createMiddleware<
  AppEnv & SessionUserEnv & DbEnv & UserRecordEnv
>(async (c, next) => {
  const sessionUser = c.get("sessionUser");
  const userRecord = await getUser(c.get("db"), sessionUser.id);

  if (!userRecord) {
    return c.json({ error: "User not found" }, 404);
  }

  const userScopes = userRecord.scope.split(" ");

  if (!requiredUserScopes.every((scope) => userScopes.includes(scope))) {
    // TODO: delete user and session records since they won't be able to use the app without reauthenticating
    return c.json({ error: "User is missing required scopes" }, 403);
  }

  c.set("userRecord", userRecord);
  await next();
});
