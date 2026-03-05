import z from "zod";
import { LeagueDto } from "./dtos/league/league.dto.js";
import { PriceListDto } from "./dtos/prices/price-list.dto.js";
import { StaticTradeDataSnapshotDto } from "./dtos/prices/static-trade-data.dto.js";
import {
  SyncUserInventoryResponseDto,
  SyncUserInventorySnapshotDataEnvelopeDto,
} from "./dtos/user/sync-user-inventory.dto.js";
import {
  UserInventorySnapshotsPageDto,
  UserInventorySnapshotDetailDto,
} from "./dtos/user/user-inventory-snapshot.dto.js";
import { UserSettingsDto } from "./dtos/user/user-settings.dto.js";
import { UserDto } from "./dtos/user/user.dto.js";
import { UserJobDto } from "./dtos/user/user.job.dto.js";
import { PriceHistoryEntryDto, PriceHistoryDto } from "./price-history.dto.js";

/**
 * Enum representing the API Endpoints required to implement the Ninja API.
 */
export const ApiEndpoint = {
  UserLogin: {
    method: "REDIRECT",
    path: "redirect/login",
    inputSchema: z.never(),
    outputSchema: z.never(),
  },

  GetExchangeRatesCurrencyList: {
    method: "GET",
    path: "prices/exchange-rates/:realm/:leagueId/currency",
    inputSchema: z.void(),
    outputSchema: PriceListDto,
  },
  GetExchangeRatesCurrency: {
    method: "GET",
    path: "prices/exchange-rates/:realm/:leagueId/currency/:currency",
    inputSchema: z.void(),
    outputSchema: PriceHistoryEntryDto,
  },
  GetExchangeRatesCurrencyHistorical: {
    method: "GET",
    path: "prices/exchange-rates/:realm/:leagueId/currency/:currency/historical",
    inputSchema: z.void(),
    outputSchema: PriceHistoryDto,
  },
  GetStaticTradeData: {
    method: "GET",
    path: "prices/static-trade-data",
    inputSchema: z.void(),
    outputSchema: StaticTradeDataSnapshotDto,
  },

  GetUser: {
    method: "GET",
    path: "user",
    inputSchema: z.void(),
    outputSchema: UserDto,
  },
  GetUserSettings: {
    method: "GET",
    path: "user/settings",
    inputSchema: z.void(),
    outputSchema: UserSettingsDto,
  },
  UpdateUserSettings: {
    method: "PATCH",
    path: "user/settings",
    inputSchema: UserSettingsDto.partial(),
    outputSchema: UserSettingsDto,
  },
  GetUserJobs: {
    method: "GET",
    path: "user/jobs",
    inputSchema: z.void(),
    outputSchema: z.array(z.string()),
  },
  GetUserLeagues: {
    method: "GET",
    path: "user/leagues",
    inputSchema: z.void(),
    outputSchema: z.array(LeagueDto),
  },
  GetUserJobResult: {
    method: "GET",
    path: "user/job/:jobId",
    inputSchema: z.void(),
    outputSchema: UserJobDto,
  },
  SyncUserInventory: {
    method: "POST",
    path: "user/:realm/:leagueId/sync-inventory",
    inputSchema: z.void(),
    outputSchema: SyncUserInventoryResponseDto,
  },
  GetUserInventorySnapshots: {
    method: "GET",
    path: "user/:realm/:leagueId/inventory-snapshots",
    inputSchema: z.void(),
    outputSchema: UserInventorySnapshotsPageDto,
  },
  GetUserInventorySnapshot: {
    method: "GET",
    path: "user/:realm/:leagueId/inventory-snapshots/:snapshotId",
    inputSchema: z.void(),
    outputSchema: UserInventorySnapshotDetailDto,
  },
  GetUserInventorySnapshotData: {
    method: "GET",
    path: "user/:realm/:leagueId/inventory-snapshots/:snapshotId/data",
    inputSchema: z.void(),
    outputSchema: SyncUserInventorySnapshotDataEnvelopeDto,
  },
  GetUserInventorySnapshotCurrencyList: {
    method: "GET",
    path: "user/:realm/:leagueId/inventory-snapshots/:snapshotId/currency-list",
    inputSchema: z.void(),
    outputSchema: PriceListDto,
  },
} as const;

ApiEndpoint satisfies {
  [K in keyof typeof ApiEndpoint]: {
    method: string;
    path: string;
    inputSchema: z.ZodType;
    outputSchema: z.ZodType;
  };
};

export type ApiResponse<
  T extends (typeof ApiEndpoint)[keyof typeof ApiEndpoint],
> = z.infer<T["outputSchema"]>;
