import { Hono } from "hono";
import { AppBindings } from "../bindings";
import { getValkey } from "../valkey";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

export const status = new Hono<{ Bindings: AppBindings }>();

status.get("/", (c) => {
  console.log(c.env);
  return c.json({ status: "ok" });
});

status.get("/valkey", async (c) => {
  const valkey = getValkey(c.env);
  const pong = await valkey.ping();
  return c.json({ valkey: pong });
});

status.get("/db", async (c) => {
  const db = getDb(c.env);
  await db.execute(sql`SELECT 1`);
  return c.json({ status: true });
});
