import { z } from "zod";
import { ApiEndpoint } from "./api-endpoints.enum.js";
import { UserDto } from "./dtos/user/user.dto.js";
import { UserJobDto } from "./dtos/user/user.job.dto.js";
import { LeagueDto } from "./dtos/league/league.dto.js";
import { PriceListDto } from "./dtos/prices/price-list.dto.js";
import { PriceHistoryDto } from "./dtos/prices/price-history.dto.js";

export const ApiResultResponseTypes = {
  [ApiEndpoint.UserLogin]: [z.never(), z.never()],

  [ApiEndpoint.GetExchangeRatesCurrencyList]: [z.void(), PriceListDto],
  [ApiEndpoint.GetExchangeRatesCurrency]: [z.void(), z.void()],
  [ApiEndpoint.GetExchangeRatesCurrencyHistorical]: [z.void(), PriceHistoryDto],

  [ApiEndpoint.GetLeagues]: [z.void(), z.array(LeagueDto)],

  [ApiEndpoint.GetUser]: [z.void(), UserDto],
  [ApiEndpoint.GetUserJobs]: [z.void(), z.array(UserJobDto)],
} as const;

export type ApiResultResponseData<T extends ApiEndpoint> = [
  z.infer<(typeof ApiResultResponseTypes)[T][0]>,
  z.infer<(typeof ApiResultResponseTypes)[T][1]>,
];

export type ApiRequest<T extends ApiEndpoint> = ApiResultResponseData<T>[0];

export type ApiResponse<T extends ApiEndpoint> = ApiResultResponseData<T>[1];
