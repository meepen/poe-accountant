import { z } from "zod";

export const PriceTabResultRequest = z.object({
  searchId: z.string(),
});
