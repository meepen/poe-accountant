import { z } from "zod";
import { Price } from "./price.dto.js";

export const PriceItemResultResponse = z.object({
  completed: z.boolean(),
  price: Price.optional(),
});
