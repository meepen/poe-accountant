/**
 * Enum representing the API Endpoints required to implement the Ninja API.
 */
export enum ApiEndpoint {
  UserLogin = "redirect/login",

  PriceItemRequest = "item/price",
  PriceTabRequest = "tab/price",
  PriceItemResult = "item/price/result",
  PriceTabResult = "tab/price/result",

  GetUser = "user",
  GetUserJobs = "user/jobs",
}

export const ApiEndpointMethods = {
  [ApiEndpoint.UserLogin]: "REDIRECT",

  [ApiEndpoint.PriceItemRequest]: "POST",
  [ApiEndpoint.PriceTabRequest]: "POST",
  [ApiEndpoint.PriceItemResult]: "GET",
  [ApiEndpoint.PriceTabResult]: "GET",

  [ApiEndpoint.GetUser]: "GET",
  [ApiEndpoint.GetUserJobs]: "GET",
} as const;
