/**
 * Enum representing the API Endpoints required to implement the Ninja API.
 */
export enum ApiEndpoint {
  UserLogin = "redirect/login",
  GetUser = "user",

  PriceItemRequest = "item/price",
  PriceTabRequest = "tab/price",
  PriceItemResult = "item/price/result",
  PriceTabResult = "tab/price/result",
}

export const ApiEndpointMethods = {
  [ApiEndpoint.UserLogin]: "REDIRECT",
  [ApiEndpoint.GetUser]: "GET",

  [ApiEndpoint.PriceItemRequest]: "POST",
  [ApiEndpoint.PriceTabRequest]: "POST",
  [ApiEndpoint.PriceItemResult]: "GET",
  [ApiEndpoint.PriceTabResult]: "GET",
} as const;
