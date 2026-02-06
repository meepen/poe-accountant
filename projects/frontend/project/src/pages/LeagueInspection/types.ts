import { z } from "zod";
import { LeagueDto } from "@meepen/poe-accountant-api-schema/api/dtos/league/league.dto";
import { PriceListDto } from "@meepen/poe-accountant-api-schema/api/dtos/prices/price-list.dto";

export type League = z.infer<typeof LeagueDto>;
export type PriceListItem = z.infer<typeof PriceListDto>[number];
export type PriceHistoryItem = {
  historyId?: string;
  currency: string;
  valuedAt: string;
  stableCurrency: string;
  directMarketRate?: string | null;
  confidenceScore?: number;
  liquidity?: string;
  dataStaleness: string;
  calculationPath?: string[];
};

export type HistoryState = {
  loading: boolean;
  data: PriceHistoryItem[] | null;
  error: string | null;
};

export type ChartData = {
  x: Date[];
  series: { data: (number | null)[]; label: string }[];
};
