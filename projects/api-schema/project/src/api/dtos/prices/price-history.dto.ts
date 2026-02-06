import { z } from "zod";

export const PriceHistoryEntryDto = z.object({
  historyId: z.string(),
  currency: z.string(),
  valuedAt: z.string(),
  stableCurrency: z.string(),
  directMarketRate: z.string().nullable().optional(),
  confidenceScore: z.number(),
  liquidity: z.string(),
  dataStaleness: z.string(),
  calculationPath: z.array(z.string()),
});

export const PriceHistoryDto = z.array(PriceHistoryEntryDto);
