import { z } from "zod";

export const PriceRelativeToDto = z.object({
  currency: z.string(),
  amount: z.string().describe("The amount of the currency, decimal string"),
});
