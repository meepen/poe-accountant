import { z } from "zod";

export const LeagueDto = z.object({
  id: z.string(),
  leagueId: z.string(),
  leagueName: z.string().nullable(),
  realm: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
});
