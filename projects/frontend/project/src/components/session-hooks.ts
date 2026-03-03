import { use } from "react";
import { SessionContext } from "./session-context";
import { LeagueContext, type LeagueContextType } from "./league-context";

export function useSession() {
  const context = use(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}

export function useApi() {
  return useSession().api;
}

export function useLeagueSelection(): LeagueContextType {
  const context: LeagueContextType | undefined = use(LeagueContext);
  if (context === undefined) {
    throw new Error("useLeagueSelection must be used within a LeagueProvider");
  }
  return context;
}
