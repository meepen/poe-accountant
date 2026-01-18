import { z } from "zod";

export const PriceItemResultRequest = z.object({
  searchId: z.string(),
});
