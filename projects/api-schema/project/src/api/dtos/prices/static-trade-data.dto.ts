import { z } from "zod";

export const StaticTradeDataCategoryEntryDto = z.object({
  id: z.string(),
  text: z.string(),
  image: z.string().optional(),
});

export const StaticTradeDataCategoryDto = z.object({
  id: z.string(),
  label: z.string().nullable(),
  entries: z.array(StaticTradeDataCategoryEntryDto),
});

export const StaticTradeDataDto = z.object({
  result: z.array(StaticTradeDataCategoryDto),
});

export const StaticTradeDataSnapshotDto = z.object({
  refreshedAt: z.string(),
  data: StaticTradeDataDto,
});

export type StaticTradeData = z.infer<typeof StaticTradeDataDto>;
export type StaticTradeDataSnapshot = z.infer<
  typeof StaticTradeDataSnapshotDto
>;
