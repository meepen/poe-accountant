import { z } from "zod";

export const UserJobDto = z
  .object({
    id: z.string(),
  })
  .catchall(z.unknown());

export type UserJobDto = z.infer<typeof UserJobDto>;
