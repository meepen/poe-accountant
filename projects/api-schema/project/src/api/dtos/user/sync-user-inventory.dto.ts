import { z } from "zod";
import { UserJobDto } from "./user.job.dto.js";

export const SyncUserInventoryJobDataDto = z.record(
  z.string(),
  z.array(
    z.object({
      count: z.number(),
      value: z.number(),
      location: z.string(),
    }),
  ),
);
export type SyncUserInventoryJobDataDto = z.infer<
  typeof SyncUserInventoryJobDataDto
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
