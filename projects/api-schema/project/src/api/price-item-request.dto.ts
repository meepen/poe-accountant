import { z } from "zod";
import { Item } from "@meepen/poe-common";

export const PriceItemRequest = z.object({
  item: Item,
  leagueId: z.string(),
  realm: z.string(),
});
