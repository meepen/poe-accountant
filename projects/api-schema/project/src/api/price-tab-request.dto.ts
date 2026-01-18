import { z } from "zod";
import { StashTab } from "@meepen/poe-common";

export const PriceTabRequest = z.object({
  leagueId: z.string(),
  realm: z.string(),
  tab: StashTab,
});
