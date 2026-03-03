import { Hono } from "hono";
import { sql } from "drizzle-orm";
import type { IndexEnv } from "..";

export const status = new Hono<IndexEnv>();

status.get("/", (c) => {
  return c.json({ status: true });
});

status.get("/valkey", async (c) => {
  const pong = await c.get("valkey").ping();
  return c.json({ status: pong === "PONG" });
});

status.get("/db", async (c) => {
  await c.get("db").execute(sql`SELECT 1`);
  return c.json({ status: true });
});

status.get("/s3", async (c) => {
  const s3 = c.get("s3");
  const response = await s3.list(1);

  return c.json({ status: response.ok });
});
