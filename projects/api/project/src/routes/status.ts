import { Hono } from "hono";
import { AppBindings } from "../bindings";
import { getValkey } from "../valkey";
import { getDb } from "../db";
import { sql } from "drizzle-orm";
import { getS3 } from "../s3";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

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

status.get("/s3", async (c) => {
  const s3 = getS3(c.env);
  const result = await s3.send(
    new ListObjectsV2Command({ Bucket: c.env.S3_BUCKET_NAME, MaxKeys: 1 }),
  );
  return c.json({ status: true, objects: result.KeyCount });
});
