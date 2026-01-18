import { z } from "zod";
import { Currency } from "./currency.enum.js";

export const Price = z.object({
  currency: Currency,
  fractional: z.tuple([z.number(), z.number()]),
});
