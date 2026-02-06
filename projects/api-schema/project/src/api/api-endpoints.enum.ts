/**
 * Enum representing the API Endpoints required to implement the Ninja API.
 */
export enum ApiEndpoint {
  UserLogin = "redirect/login",

  GetExchangeRatesCurrencyList = "prices/exchange-rates/:realm/:leagueId/currency",
  GetExchangeRatesCurrency = "prices/exchange-rates/:realm/:leagueId/currency/:currency",
  GetExchangeRatesCurrencyHistorical = "prices/exchange-rates/:realm/:leagueId/currency/:currency/historical",

  GetLeagues = "league",

  GetUser = "user",
  GetUserJobs = "user/jobs",
}

export const ApiEndpointMethods = {
  [ApiEndpoint.UserLogin]: "REDIRECT",

  [ApiEndpoint.GetExchangeRatesCurrencyList]: "GET",
  [ApiEndpoint.GetExchangeRatesCurrency]: "GET",
  [ApiEndpoint.GetExchangeRatesCurrencyHistorical]: "GET",

  [ApiEndpoint.GetLeagues]: "GET",

  [ApiEndpoint.GetUser]: "GET",
  [ApiEndpoint.GetUserJobs]: "GET",
} as const;
