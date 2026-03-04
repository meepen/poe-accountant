/**
 * Enum representing the API Endpoints required to implement the Ninja API.
 */
export enum ApiEndpoint {
  UserLogin = "redirect/login",

  GetExchangeRatesCurrencyList = "prices/exchange-rates/:realm/:leagueId/currency",
  GetExchangeRatesCurrency = "prices/exchange-rates/:realm/:leagueId/currency/:currency",
  GetExchangeRatesCurrencyHistorical = "prices/exchange-rates/:realm/:leagueId/currency/:currency/historical",
  GetStaticTradeData = "prices/static-trade-data",

  GetUser = "user",
  GetUserJobs = "user/jobs",
  GetUserLeagues = "user/leagues",
  GetUserJobResult = "user/job/:jobId",
  SyncUserInventory = "user/sync-inventory",
  GetUserInventorySnapshots = "user/inventory-snapshots",
  GetUserInventorySnapshot = "user/inventory-snapshots/:snapshotId",
  GetUserInventorySnapshotData = "user/inventory-snapshots/:snapshotId/data",
}

export const ApiEndpointMethods = {
  [ApiEndpoint.UserLogin]: "REDIRECT",

  [ApiEndpoint.GetExchangeRatesCurrencyList]: "GET",
  [ApiEndpoint.GetExchangeRatesCurrency]: "GET",
  [ApiEndpoint.GetExchangeRatesCurrencyHistorical]: "GET",
  [ApiEndpoint.GetStaticTradeData]: "GET",

  [ApiEndpoint.GetUser]: "GET",
  [ApiEndpoint.GetUserJobs]: "GET",
  [ApiEndpoint.GetUserLeagues]: "GET",
  [ApiEndpoint.GetUserJobResult]: "GET",
  [ApiEndpoint.SyncUserInventory]: "POST",
  [ApiEndpoint.GetUserInventorySnapshots]: "GET",
  [ApiEndpoint.GetUserInventorySnapshot]: "GET",
  [ApiEndpoint.GetUserInventorySnapshotData]: "GET",
} as const;
