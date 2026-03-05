import { z } from "zod";
import { UserJobDto } from "./user.job.dto.js";

export const SyncUserInventoryJobDataSchemaVersion = 2 as const;

export const SyncUserInventoryItemEntryDto = z.object({
  itemId: z.string(),
  itemName: z.string(),
  icon: z.string().nullable(),
  count: z.number(),
  value: z.number(),
  valueCurrency: z.string(),
  location: z.string(),
  stashTabId: z.string(),
  stashTabName: z.string(),
});

export const SyncUserInventoryJobDataDto = z.object({
  schemaVersion: z.literal(SyncUserInventoryJobDataSchemaVersion),
  items: z.record(z.string(), z.array(SyncUserInventoryItemEntryDto)),
  stashTabs: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      color: z.string().optional(),
    }),
  ),
});

export type SyncUserInventoryJobDataDto = z.infer<
  typeof SyncUserInventoryJobDataDto
>;

export const SyncUserInventorySnapshotDataEnvelopeDto = z.looseObject({
  schemaVersion: z.number().int().nonnegative().optional(),
});

export type SyncUserInventorySnapshotDataEnvelopeDto = z.infer<
  typeof SyncUserInventorySnapshotDataEnvelopeDto
>;

export const SyncUserInventoryResponseDto = UserJobDto.and(
  z.discriminatedUnion("done", [
    z.object({
      done: z.literal(false),
      data: z.unknown(),
    }),
    z.object({
      done: z.literal(true),
      data: SyncUserInventoryJobDataDto,
    }),
  ]),
);

export type SyncUserInventoryResponseDto = z.infer<
  typeof SyncUserInventoryResponseDto
>;
