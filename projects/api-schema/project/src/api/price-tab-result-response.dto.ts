import { z } from "zod";
import { Price } from "./price.dto.js";
import { Item } from "@meepen/poe-common";

export const ItemPrice = z.object({
  price: Price,
  item: Item,
});

export const PriceTabResultResponse = z.object({
  completed: z.boolean(),
  prices: z.array(ItemPrice).optional(),
});
