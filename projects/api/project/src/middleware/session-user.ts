import { getSessionUser } from "../db/user";
import type { ValkeyEnv } from "./valkey";
import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../bindings";

export type SessionUserEnv = {
  Variables: {
    sessionUser: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;
  };
};
export const requireSessionUser = createMiddleware<
  AppEnv & SessionUserEnv & ValkeyEnv
>(async (c, next) => {
  if (c.get("sessionUser") as unknown) {
    await next();
    return;
  }

  const sessionUser = await getSessionUser(c.get("valkey"), c);

  if (!sessionUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("sessionUser", sessionUser);
  await next();
});
