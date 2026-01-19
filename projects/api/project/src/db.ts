import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@meepen/poe-accountant-db-schema";
import postgres from "postgres";
import { AppBindings } from "./bindings";

export function getDb(env: AppBindings) {
  const client = postgres(env.HYPERDRIVE.connectionString, { max: 10 });

  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof getDb>;
