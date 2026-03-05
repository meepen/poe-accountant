import { createContext } from "react";
import type { StaticTradeDataSnapshot } from "@meepen/poe-accountant-api-schema/api/dtos/prices/static-trade-data.dto";

export type StaticTradeDataEntry = {
  entry: StaticTradeDataSnapshot["data"]["result"][0]["entries"][0];
  category: StaticTradeDataSnapshot["data"]["result"][0];
};

export interface StaticTradeDataStateContextType {
  entries: StaticTradeDataEntry[];
  entryById: ReadonlyMap<string, StaticTradeDataEntry>;
  entryByName: ReadonlyMap<string, StaticTradeDataEntry>;
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
