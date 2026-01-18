/**
 * Enum representing the API Endpoints required to implement the Ninja API.
 */
export enum ApiEndpoint {
  PriceItemRequest = "item/price",
  PriceTabRequest = "tab/price",
  PriceItemResult = "item/price/result",
  PriceTabResult = "tab/price/result",
}

export const ApiEndpointMethods = {
  [ApiEndpoint.PriceItemRequest]: "POST",
  [ApiEndpoint.PriceTabRequest]: "POST",
  [ApiEndpoint.PriceItemResult]: "GET",
  [ApiEndpoint.PriceTabResult]: "GET",
} as const;
