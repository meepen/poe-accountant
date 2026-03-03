import { z } from "zod";

export const InventorySyncMessageQueue = "inventory_sync_queue";

export const InventorySyncMessage = z.object({
  userId: z.uuid(),
  redisKey: z.string().min(1),
  league: z.object({
    id: z.string(),
    realm: z.string(),
  }),
});

export const InventorySyncMailboxSchema = z.object({
  targetQueue: z.literal(InventorySyncMessageQueue),
  message: InventorySyncMessage,
});
