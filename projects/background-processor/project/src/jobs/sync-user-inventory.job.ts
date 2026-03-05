import { z } from "zod";
import type { SyncUserInventoryResponseDto } from "@meepen/poe-accountant-api-schema";
import {
  UserJobRedisMetadataTtlSeconds,
  InventorySyncMessage,
  InventorySyncMessageQueue,
} from "@meepen/poe-accountant-api-schema";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { UserInventorySnapshot } from "@meepen/poe-accountant-db-schema";
import { and, eq } from "drizzle-orm";
import { QueueWorker } from "./queue-worker.abstract.js";
import { db } from "../connections/db.js";
import { valkey } from "../connections/valkey.js";
import { bucketName, s3 } from "../connections/s3.js";
import { priceUserInventory } from "./sync-user-inventory/price-user-inventory.js";

async function setUserJobState(
  redisKey: string,
  value: z.infer<typeof SyncUserInventoryResponseDto>,
) {
  await valkey.set(
    redisKey,
    JSON.stringify(value),
    "EX",
    UserJobRedisMetadataTtlSeconds,
  );
}

export class SyncUserInventoryJob extends QueueWorker<
  typeof InventorySyncMessage
> {
  protected override readonly schema = InventorySyncMessage;
  protected override readonly returnSchema = z.void();
  protected override readonly queueName = InventorySyncMessageQueue;

  protected override async processJob(
    data: z.infer<typeof InventorySyncMessage>,
  ): Promise<void> {
    const jobId = data.jobId;

    await setUserJobState(data.redisKey, {
      id: jobId,
      done: false,
      data: {
        status: "processing",
      },
    });

    const user = await db.query.User.findFirst({
      where: (userTable, { eq: equals }) => equals(userTable.id, data.userId),
    });

    if (!user) {
      throw new Error(`User '${data.userId}' not found for inventory sync.`);
    }

    const league = await db.query.League.findFirst({
      where: (leagueTable) =>
        and(
          eq(leagueTable.leagueId, data.league.id),
          eq(leagueTable.realm, data.league.realm),
        ),
    });

    if (!league) {
      throw new Error(
        `League '${data.league.id}' in realm '${data.league.realm}' not found.`,
      );
    }

    try {
      const inventoryData = await priceUserInventory(user, league);

      const generatedAt = new Date();
      const snapshotId = crypto.randomUUID();
      const r2ObjectKey = `users/${data.userId}/inventory-snapshots/${generatedAt.toISOString()}-${snapshotId}.json`;

      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: r2ObjectKey,
          ContentType: "application/json",
          Body: JSON.stringify(inventoryData),
        }),
      );

      const totalValue = Object.values(inventoryData.items)
        .flat()
        .reduce((result, entry) => result + entry.value, 0);

      await db.insert(UserInventorySnapshot).values({
        id: snapshotId,
        userId: data.userId,
        realm: league.realm,
        leagueId: league.leagueId,
        generatedAt,
        r2ObjectKey,
        totalValue: totalValue.toString(),
        createdAt: new Date(),
      });

      await setUserJobState(data.redisKey, {
        id: jobId,
        done: true,
        data: inventoryData,
      });
    } catch (error: unknown) {
      await setUserJobState(data.redisKey, {
        id: jobId,
        done: false,
        data: {
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });

      throw error;
    }
  }
}
