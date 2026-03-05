import { createContext } from "react";
import type { z } from "zod";
import type { LeagueDto } from "@meepen/poe-accountant-api-schema/api/dtos/league/league.dto";

export type League = z.infer<typeof LeagueDto>;

export interface SharedCurrencyItem {
  currency: string;
  value: {
    currency: string;
    amount: string;
  };
  confidenceScore: number;
}

export function getLeagueKey(league: Pick<League, "realm" | "leagueId">) {
  return `${league.realm}:${league.leagueId}`;
}

export interface LeagueContextType {
  leagues: League[];
  leaguesLoading: boolean;
  selectedLeagueKey: string | null;
  selectedLeague: League | null;
  sharedCurrencyList: SharedCurrencyItem[];
  sharedCurrencyListLoading: boolean;
  setSelectedLeagueKey: (value: string | null) => void;
  refreshLeagues: () => Promise<void>;
  refreshSharedCurrencyList: () => Promise<void>;
}

export const LeagueContext = createContext<LeagueContextType | undefined>(
  undefined,
);
