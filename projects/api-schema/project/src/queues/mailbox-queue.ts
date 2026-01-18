import { z } from "zod";
import { ItemPriceMailboxSchema } from "./item-price.message.js";

export const MailboxQueue = z.object({
  data: z.union([ItemPriceMailboxSchema]),
  priority: z.number().default(1000),
});
export const MailboxQueueName = "mailbox_queue";
