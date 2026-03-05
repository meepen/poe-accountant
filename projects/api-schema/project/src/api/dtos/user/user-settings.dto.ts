import { z } from "zod";

export const UserSettingsDto = z.object({
  currentLeagueId: z.uuid().nullable(),
});

export type UserSettingsDto = z.infer<typeof UserSettingsDto>;

export const UpdateUserSettingsDto = UserSettingsDto.partial();

export type UpdateUserSettingsDto = z.infer<typeof UpdateUserSettingsDto>;
