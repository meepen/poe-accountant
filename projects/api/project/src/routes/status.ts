import { Hono } from "hono";
import { AppBindings } from "../bindings";
import { getValkey } from "../valkey";
import { getDb } from "../db";
import { sql } from "drizzle-orm";
import { getS3 } from "../s3";

export const status = new Hono<{ Bindings: AppBindings }>();

status.get("/", (c) => {
  return c.json({ status: true });
});

status.get("/valkey", async (c) => {
  const valkey = getValkey(c.env);
  const pong = await valkey.ping();
  return c.json({ status: pong === "PONG" });
});

status.get("/db", async (c) => {
  const db = getDb(c.env);
  await db.execute(sql`SELECT 1`);
  return c.json({ status: true });
});

status.get("/s3", async (c) => {
  const s3 = getS3(c.env);
  const response = await s3.list(1);

  return c.json({ status: response.ok });
});
