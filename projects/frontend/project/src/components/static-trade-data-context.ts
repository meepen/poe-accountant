import { createContext } from "react";
import type { StaticTradeDataSnapshot } from "@meepen/poe-accountant-api-schema/api/dtos/prices/static-trade-data.dto";

export interface StaticTradeDataStateContextType {
  snapshot: StaticTradeDataSnapshot | null;
  currencyNameByKey: ReadonlyMap<string, string>;
  currencyImageByKey: ReadonlyMap<string, string>;
  isLoading: boolean;
  error: string | null;
}

export interface StaticTradeDataActionsContextType {
  loadStaticTradeData: (options?: { force?: boolean }) => Promise<void>;
  clearStaticTradeData: () => void;
}

export const StaticTradeDataStateContext = createContext<
  StaticTradeDataStateContextType | undefined
>(undefined);

export const StaticTradeDataActionsContext = createContext<
  StaticTradeDataActionsContextType | undefined
>(undefined);
