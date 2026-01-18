import { z } from "zod";

export const PriceItemResponse = z.object({
  searchId: z.string(),
});
