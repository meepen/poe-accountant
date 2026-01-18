import { z } from "zod";

export const PriceTabResponse = z.object({
  searchId: z.string(),
});
