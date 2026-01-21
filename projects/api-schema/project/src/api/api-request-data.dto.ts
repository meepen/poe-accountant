import { z } from "zod";
import { ApiEndpoint } from "./api-endpoints.enum.js";
import { PriceItemRequest } from "./price-item-request.dto.js";
import { PriceItemResponse } from "./price-item-response.dto.js";
import { PriceItemResultRequest } from "./price-item-result-request.dto.js";
import { PriceItemResultResponse } from "./price-item-result-response.dto.js";
import { PriceTabRequest } from "./price-tab-request.dto.js";
import { PriceTabResponse } from "./price-tab-response.dto.js";
import { PriceTabResultRequest } from "./price-tab-result-request.dto.js";
import { PriceTabResultResponse } from "./price-tab-result-response.dto.js";
import { UserDto } from "./user.dto.js";
import { UserJobDto } from "./user.job.dto.js";

export const ApiResultResponseTypes = {
  [ApiEndpoint.UserLogin]: [z.never(), z.never()],

  [ApiEndpoint.PriceItemRequest]: [PriceItemRequest, PriceItemResponse],
  [ApiEndpoint.PriceTabRequest]: [PriceTabRequest, PriceTabResponse],
  [ApiEndpoint.PriceItemResult]: [
    PriceItemResultRequest,
    PriceItemResultResponse,
  ],
  [ApiEndpoint.PriceTabResult]: [PriceTabResultRequest, PriceTabResultResponse],

  [ApiEndpoint.GetUser]: [z.void(), UserDto],
  [ApiEndpoint.GetUserJobs]: [z.void(), z.array(UserJobDto)],
} as const;

export type ApiResultResponseData<T extends ApiEndpoint> = [
  z.infer<(typeof ApiResultResponseTypes)[T][0]>,
  z.infer<(typeof ApiResultResponseTypes)[T][1]>,
];

export type ApiRequest<T extends ApiEndpoint> = ApiResultResponseData<T>[0];

export type ApiResponse<T extends ApiEndpoint> = ApiResultResponseData<T>[1];
