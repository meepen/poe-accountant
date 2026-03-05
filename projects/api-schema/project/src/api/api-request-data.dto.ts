import { z } from "zod";
import { ApiEndpoint } from "./api-endpoints.enum.js";
import { UserDto } from "./dtos/user/user.dto.js";
import { UserJobDto } from "./dtos/user/user.job.dto.js";
import { LeagueDto } from "./dtos/league/league.dto.js";
import { PriceListDto } from "./dtos/prices/price-list.dto.js";
import {
  PriceHistoryDto,
  PriceHistoryEntryDto,
} from "./dtos/prices/price-history.dto.js";
import { StaticTradeDataSnapshotDto } from "./dtos/prices/static-trade-data.dto.js";
import {
  SyncUserInventorySnapshotDataEnvelopeDto,
  SyncUserInventoryResponseDto,
} from "./dtos/user/sync-user-inventory.dto.js";
import {
  UserInventorySnapshotDetailDto,
  UserInventorySnapshotsPageDto,
} from "./dtos/user/user-inventory-snapshot.dto.js";

export const ApiResultResponseTypes = {
  [ApiEndpoint.UserLogin]: [z.never(), z.never()],

  [ApiEndpoint.GetExchangeRatesCurrencyList]: [z.void(), PriceListDto],
  [ApiEndpoint.GetExchangeRatesCurrency]: [z.void(), PriceHistoryEntryDto],
  [ApiEndpoint.GetExchangeRatesCurrencyHistorical]: [z.void(), PriceHistoryDto],
  [ApiEndpoint.GetStaticTradeData]: [z.void(), StaticTradeDataSnapshotDto],

  [ApiEndpoint.GetUser]: [z.void(), UserDto],
  [ApiEndpoint.GetUserJobs]: [z.void(), z.array(z.string())],
  [ApiEndpoint.GetUserLeagues]: [z.void(), z.array(LeagueDto)],
  [ApiEndpoint.GetUserJobResult]: [z.void(), UserJobDto],
  [ApiEndpoint.SyncUserInventory]: [z.void(), SyncUserInventoryResponseDto],
  [ApiEndpoint.GetUserInventorySnapshots]: [
    z.void(),
    UserInventorySnapshotsPageDto,
  ],
  [ApiEndpoint.GetUserInventorySnapshot]: [
    z.void(),
    UserInventorySnapshotDetailDto,
  ],
  [ApiEndpoint.GetUserInventorySnapshotData]: [
    z.void(),
    SyncUserInventorySnapshotDataEnvelopeDto,
  ],
  [ApiEndpoint.GetUserInventorySnapshotCurrencyList]: [z.void(), PriceListDto],
} as const;

export type ApiResultResponseData<T extends ApiEndpoint> = [
  z.infer<(typeof ApiResultResponseTypes)[T][0]>,
  z.infer<(typeof ApiResultResponseTypes)[T][1]>,
];

export type ApiRequest<T extends ApiEndpoint> = ApiResultResponseData<T>[0];

export type ApiResponse<T extends ApiEndpoint> = ApiResultResponseData<T>[1];
