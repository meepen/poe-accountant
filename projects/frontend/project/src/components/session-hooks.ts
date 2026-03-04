import { use } from "react";
import { SessionContext } from "./session-context";
import { LeagueContext, type LeagueContextType } from "./league-context";
import {
  StaticTradeDataActionsContext,
  StaticTradeDataStateContext,
  type StaticTradeDataActionsContextType,
  type StaticTradeDataStateContextType,
} from "./static-trade-data-context";

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

export function useStaticTradeDataState(): StaticTradeDataStateContextType {
  const context: StaticTradeDataStateContextType | undefined = use(
    StaticTradeDataStateContext,
  );
  if (context === undefined) {
    throw new Error(
      "useStaticTradeDataState must be used within a StaticTradeDataProvider",
    );
  }
  return context;
}

export function useStaticTradeDataActions(): StaticTradeDataActionsContextType {
  const context: StaticTradeDataActionsContextType | undefined = use(
    StaticTradeDataActionsContext,
  );
  if (context === undefined) {
    throw new Error(
      "useStaticTradeDataActions must be used within a StaticTradeDataProvider",
    );
  }
  return context;
}

export function useStaticTradeData() {
  return {
    ...useStaticTradeDataState(),
    ...useStaticTradeDataActions(),
  };
}
