import { ApiEndpoint } from "./api-endpoints.enum.js";
import { PriceItemRequest } from "./price-item-request.dto.js";
import { PriceItemResponse } from "./price-item-response.dto.js";
import { PriceItemResultRequest } from "./price-item-result-request.dto.js";
import { PriceItemResultResponse } from "./price-item-result-response.dto.js";
import { PriceTabRequest } from "./price-tab-request.dto.js";
import { PriceTabResponse } from "./price-tab-response.dto.js";
import { PriceTabResultRequest } from "./price-tab-result-request.dto.js";
import { PriceTabResultResponse } from "./price-tab-result-response.dto.js";

export const ApiResultResponseTypes = {
  [ApiEndpoint.PriceItemRequest]: [PriceItemRequest, PriceItemResponse],
  [ApiEndpoint.PriceTabRequest]: [PriceTabRequest, PriceTabResponse],
  [ApiEndpoint.PriceItemResult]: [
    PriceItemResultRequest,
    PriceItemResultResponse,
  ],
  [ApiEndpoint.PriceTabResult]: [PriceTabResultRequest, PriceTabResultResponse],
} as const;

export type ApiResultResponseData<T extends ApiEndpoint> = [
  InstanceType<(typeof ApiResultResponseTypes)[T][0]>,
  InstanceType<(typeof ApiResultResponseTypes)[T][1]>,
];

export type ApiRequest<T extends ApiEndpoint> = ApiResultResponseData<T>[0];

export type ApiResponse<T extends ApiEndpoint> = ApiResultResponseData<T>[1];
