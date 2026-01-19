import { z } from "zod";

export const ItemPriceMessage = z.object({});

export const ItemPriceMessageQueue = "item_price_queue";

export const ItemPriceMailboxSchema = z.object({
  targetQueue: z.literal(ItemPriceMessageQueue),
  message: ItemPriceMessage,
});
