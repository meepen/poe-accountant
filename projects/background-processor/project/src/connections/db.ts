import postgres from "postgres";
import schema from "@meepen/poe-accountant-db-schema";
import { getEnvVar } from "../utils.js";
import { drizzle } from "drizzle-orm/postgres-js";
import {
  BuildQueryResult,
  DBQueryConfig,
  ExtractTablesWithRelations,
} from "drizzle-orm";

export const client = postgres(getEnvVar("DATABASE_URL"), {
  max: 5,
});

export const db = drizzle(client, { schema });

type TTables = ExtractTablesWithRelations<(typeof db)["_"]["fullSchema"]>;

export type InferResultType<
  TTableName extends keyof TTables,
  TConfig extends DBQueryConfig<"many", true, TTables, TTables[TTableName]>,
> = BuildQueryResult<TTables, TTables[TTableName], TConfig>;

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
