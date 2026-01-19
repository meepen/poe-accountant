import { z } from "zod";
import { Item } from "@meepen/poe-common";
import { Price } from "./price.dto.js";

export const PricedItem = z.object({
  item: Item,
  price: Price,
});
