import { z } from "zod";
import { ItemPriceMailboxSchema } from "./item-price.message.js";
import { InventorySyncMailboxSchema } from "./inventory-sync.message.js";
import { CharacterReceiverMailboxSchema } from "./character-receiver.message.js";

export const MailboxQueue = z.object({
  messageId: z.uuid(),
  data: z.union([
    ItemPriceMailboxSchema,
    InventorySyncMailboxSchema,
    CharacterReceiverMailboxSchema,
  ]),
  priority: z.number().default(1000),
});
export const MailboxQueueName = "mailbox_queue";
