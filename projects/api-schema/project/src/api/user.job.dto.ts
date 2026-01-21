import { z } from "zod";

export const UserJobDto = z.object({
  id: z.uuid(),

  isComplete: z.boolean(),
  statusText: z.string(),

  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
