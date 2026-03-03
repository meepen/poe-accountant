import { drizzle } from "drizzle-orm/postgres-js";
import schema from "@meepen/poe-accountant-db-schema";
import postgres from "postgres";
import type { AppBindings, AppEnv } from "../bindings";
import { createMiddleware } from "hono/factory";

function getDb(env: AppBindings) {
  const client = postgres(env.HYPERDRIVE.connectionString, { max: 10 });

  return drizzle(client, { schema });
}
export type Database = ReturnType<typeof getDb>;
export type DbEnv = {
  Variables: {
    db: Database;
  };
};

export const dbMiddleware = createMiddleware<AppEnv & DbEnv>(
  async (c, next) => {
    if (!c.get("db") as unknown) {
      c.set("db", getDb(c.env));
    }

    await next();
  },
);
