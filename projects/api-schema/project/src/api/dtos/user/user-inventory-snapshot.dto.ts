import { z } from "zod";

export const UserInventorySnapshotDto = z.object({
  id: z.uuid(),
  realm: z.string(),
  leagueId: z.string(),
  generatedAt: z.iso.datetime(),
  totalValue: z.string(),
});

export type UserInventorySnapshotDto = z.infer<typeof UserInventorySnapshotDto>;

export const UserInventorySnapshotDetailDto = UserInventorySnapshotDto.extend({
  r2ObjectKey: z.string(),
});

export type UserInventorySnapshotDetailDto = z.infer<
  typeof UserInventorySnapshotDetailDto
>;

export const UserInventorySnapshotsPageDto = z.object({
  page: z.int().min(0),
  beginningTime: z.iso.datetime(),
  endTime: z.iso.datetime(),
  snapshots: z.array(UserInventorySnapshotDto),
});

export type UserInventorySnapshotsPageDto = z.infer<
  typeof UserInventorySnapshotsPageDto
>;
