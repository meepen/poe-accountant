import { parentPort } from "worker_threads";
import type {
  MarketInput,
  VendorRecipe,
} from "../jobs/update-currency-data/market-graph.js";
import { CurrencyGraph } from "../jobs/update-currency-data/market-graph.js";

interface WorkerInput {
  markets: MarketInput[];
  vendorRecipes: readonly VendorRecipe[];
}

parentPort?.on("message", (message: unknown) => {
  try {
    const { markets, vendorRecipes } = message as WorkerInput;

    const currencyGraph = new CurrencyGraph(markets, vendorRecipes);
    const ratesMap = currencyGraph.getRatesRelativeTo("chaos");

    const rates = Array.from(ratesMap.values()).filter(
      (rate) => rate.currency !== "chaos",
    );

    parentPort?.postMessage({
      success: true,
      data: rates,
    });
  } catch (error) {
    parentPort?.postMessage({
      success: false,
      error: error,
    });
  }
});
