import { InferResultType } from "../../connections/db.js";

// --- Types ---

type TimeSeries<
  NumberType extends bigint | number,
  Currencies extends string[] = [string, string],
> = Record<Currencies[number], NumberType>;

/**
 * Represents a single market data point for a currency pair.
 */
export type MarketData<Currencies extends string[] = [string, string]> = {
  volumeTraded: TimeSeries<bigint, Currencies>;
  lowestRatio: TimeSeries<number, Currencies>;
  occurredAt: Date;
  isVendor?: boolean;
};

export type MarketDataEntry<FromCurrency extends string> = {
  [toCurrency: string]:
    | MarketData<[FromCurrency, typeof toCurrency]>[]
    | undefined;
};
export type MarketDataMap = {
  [fromCurrency: string]: MarketDataEntry<typeof fromCurrency> | undefined;
};

export type CurrencyExchangeWithRelations = InferResultType<
  "CurrencyExchangeHistoryCurrency",
  {
    with: {
      history: true;
    };
  }
>;

/**
 * Result of the rate calculation for a specific currency.
 */
export interface RateResult {
  currency: string;
  optimalRate: number;
  directRate: number | null;
  arbitragePercentage: number;
  path: string[];
  reliability: number;
  roundTripRate: number;
  roundTripLiquidity: bigint;
  liquidity: bigint;
  lastUpdate: Date;
}

interface EdgeAnalysis {
  totalVolume: bigint;
  vwap: number;
  recencyRatio: number;
  lastUpdate: number;
}

export type VendorRecipe = {
  from: string;
  to: string;
  rate: number;
};

// --- Class Implementation ---

/**
 * Graph structure representing currency exchange markets.
 * Capable of finding optimal exchange paths and calculating rates.
 */
export class CurrencyGraph {
  private graph: MarketDataMap;
  private minTimestamp: number;
  private maxTimestamp: number;

  constructor(
    markets: CurrencyExchangeWithRelations[],
    private readonly vendorRecipes: readonly VendorRecipe[],
  ) {
    this.graph = {};

    // 1. Inject Vendor Recipes
    this.injectVendorRecipes();

    // 2. Process Market Data
    for (const market of markets) {
      const A = market.fromCurrency;
      const B = market.toCurrency;

      this.addEntry(
        A,
        B,
        market.fromVolume,
        market.toVolume,
        market.lowestRatio,
        market.highestRatio,
        market.history.timestamp,
      );

      const safeLow = market.lowestRatio > 0 ? market.lowestRatio : 1;
      const safeHigh = market.highestRatio > 0 ? market.highestRatio : 1;

      this.addEntry(
        B,
        A,
        market.toVolume,
        market.fromVolume,
        1 / safeHigh,
        1 / safeLow,
        market.history.timestamp,
      );
    }

    // 3. Initialize global time bounds
    let hasData: boolean;
    [this.maxTimestamp, this.minTimestamp, hasData] = Object.values(
      this.graph,
    ).reduce<[number, number, boolean]>(
      ([maxTime, minTime, hasData], neighbors) => {
        for (const dataArray of Object.values(
          neighbors as NonNullable<typeof neighbors>,
        )) {
          for (const entry of dataArray as NonNullable<typeof dataArray>) {
            const time = entry.occurredAt.getTime();
            if (time < minTime) {
              minTime = time;
            }
            if (time > maxTime) {
              maxTime = time;
            }
            hasData = true;
          }
        }
        return [maxTime, minTime, hasData];
      },
      [-Infinity, Infinity, false],
    );

    if (!hasData) {
      this.minTimestamp = Date.now();
      this.maxTimestamp = Date.now();
    }
  }

  private addEntry(
    from: string,
    to: string,
    volFrom: bigint,
    volTo: bigint,
    ratioFrom: number,
    ratioTo: number,
    timestamp: Date,
    isVendor = false,
  ) {
    if (!this.graph[from]) {
      this.graph[from] = {};
    }
    if (!this.graph[from][to]) {
      this.graph[from][to] = [];
    }

    this.graph[from][to].push({
      volumeTraded: { [from]: volFrom, [to]: volTo },
      lowestRatio: { [from]: ratioFrom, [to]: ratioTo },
      occurredAt: timestamp,
      isVendor,
    });
  }

  private injectVendorRecipes() {
    const NOW = new Date();
    const VENDOR_VOLUME = 1_000_000_000n;

    for (const recipe of this.vendorRecipes) {
      const volIn = VENDOR_VOLUME;
      const volOut = BigInt(Math.floor(Number(VENDOR_VOLUME) * recipe.rate));

      this.addEntry(
        recipe.from,
        recipe.to,
        volIn,
        volOut,
        recipe.rate,
        recipe.rate,
        NOW,
        true,
      );
    }
  }

  /**
   * Calculates optimal exchange rates relative to a stable currency.
   * Uses a modified Dijkstra's algorithm to find the most efficient paths
   * taking into account price, volume, and data recency.
   *
   * @param stableCurrency The currency to use as the base for calculations (default: "chaos")
   * @returns A map of currency names to their rate analysis results
   */
  public getRatesRelativeTo(
    stableCurrency: string = "chaos",
  ): Map<string, RateResult> {
    const pq: {
      cost: number;
      currency: string;
      rate: number;
      path: string[];
      minLiquidity: bigint;
      oldestUpdate: number;
      friction: number;
    }[] = [];

    const MAX_LIQUIDITY = 9_000_000_000_000_000_000n;

    // Track minimum costs to prune expensive paths early
    const minCosts = new Map<string, number>();

    pq.push({
      cost: 0,
      currency: stableCurrency,
      rate: 1.0,
      path: [stableCurrency],
      minLiquidity: MAX_LIQUIDITY,
      oldestUpdate: Date.now(),
      friction: 0,
    });

    minCosts.set(stableCurrency, 0);

    const results = new Map<string, RateResult>();
    const visited = new Set<string>();

    while (pq.length > 0) {
      pq.sort((a, b) => a.cost - b.cost);

      const {
        cost,
        currency: currentCurrency,
        rate: currentRate,
        path,
        minLiquidity,
        oldestUpdate,
        friction,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      } = pq.shift()!;

      // Prune if we've found a better path to this node already
      if (
        minCosts.has(currentCurrency) &&
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        minCosts.get(currentCurrency)! < cost
      ) {
        continue;
      }

      if (visited.has(currentCurrency)) {
        continue;
      }
      visited.add(currentCurrency);

      // --- 1. Direct Rate Analysis & Metrics ---
      let directRate: number | null = null;
      let forwardEdgeAnalysis: EdgeAnalysis | null = null;
      let reverseEdgeAnalysis: EdgeAnalysis | null = null;

      if (currentCurrency !== stableCurrency) {
        // Forward: Selling Current -> Buying Stable
        const forwardData = this.graph[currentCurrency]?.[stableCurrency];
        if (forwardData) {
          forwardEdgeAnalysis = this.analyzeEdge(
            currentCurrency,
            stableCurrency,
            forwardData,
          );
          if (forwardEdgeAnalysis.vwap > 0) {
            directRate = forwardEdgeAnalysis.vwap;
          }
        }

        // Reverse Fallback
        if (!directRate) {
          const reverseData = this.graph[stableCurrency]?.[currentCurrency];
          if (reverseData) {
            reverseEdgeAnalysis = this.analyzeEdge(
              stableCurrency,
              currentCurrency,
              reverseData,
            );
            if (reverseEdgeAnalysis.vwap > 0) {
              directRate = 1.0 / reverseEdgeAnalysis.vwap;
            }
          }
        }
      } else {
        directRate = 1.0;
      }

      const arbitragePercentage =
        directRate && directRate > 0
          ? ((currentRate - directRate) / directRate) * 100
          : 0;

      const reliability = 100 / (1 + friction);

      let exitRate = 0;
      let exitLiquidity = 0n;

      if (currentCurrency === stableCurrency) {
        exitRate = 1.0;
        exitLiquidity = MAX_LIQUIDITY;
      } else if (forwardEdgeAnalysis && forwardEdgeAnalysis.vwap > 0) {
        exitRate = forwardEdgeAnalysis.vwap;
        exitLiquidity = forwardEdgeAnalysis.totalVolume;
      }

      const roundTripRate = currentRate * exitRate;

      results.set(currentCurrency, {
        currency: currentCurrency,
        optimalRate: currentRate,
        directRate: directRate,
        arbitragePercentage: Number(arbitragePercentage.toFixed(2)),
        path: path,
        reliability: Number(reliability.toFixed(1)),
        roundTripRate: Number(roundTripRate.toFixed(4)),
        roundTripLiquidity: exitLiquidity,
        liquidity: minLiquidity,
        lastUpdate: new Date(oldestUpdate),
      });

      // --- Traverse Neighbors ---

      // Iterate through connected neighbors (adjacency list)
      const adjacentNodes = this.graph[currentCurrency] || {};

      for (const potentialSource in adjacentNodes) {
        // Avoid cycles
        if (path.includes(potentialSource)) {
          continue;
        }

        // We are looking for edges: Source -> Current
        // Access data from the Source's adjacency list
        const dataArray = this.graph[potentialSource]?.[currentCurrency];

        if (!dataArray) {
          continue;
        } // Should not happen given adjacency check, but safe

        const analysis = this.analyzeEdge(
          potentialSource,
          currentCurrency,
          dataArray,
        );

        if (analysis.totalVolume <= 0n || analysis.vwap <= 0) {
          continue;
        }

        const newRate = currentRate * analysis.vwap;

        // Cost Calculation
        const priceScore = -Math.log(analysis.vwap);
        const edgeFriction = this.calculateEdgeFriction(
          analysis.totalVolume,
          analysis.recencyRatio,
        );

        const newCost = cost + priceScore + edgeFriction * 0.1;
        const newFriction = friction + edgeFriction;

        // Prune paths that are more expensive than what we've already found
        if (
          minCosts.has(potentialSource) &&
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          minCosts.get(potentialSource)! <= newCost
        ) {
          continue;
        }
        minCosts.set(potentialSource, newCost);

        const newLiquidity =
          analysis.totalVolume < minLiquidity
            ? analysis.totalVolume
            : minLiquidity;

        const newOldestUpdate =
          analysis.lastUpdate < oldestUpdate
            ? analysis.lastUpdate
            : oldestUpdate;

        pq.push({
          cost: newCost,
          currency: potentialSource,
          rate: newRate,
          path: [potentialSource, ...path],
          minLiquidity: newLiquidity,
          oldestUpdate: newOldestUpdate,
          friction: newFriction,
        });
      }
    }

    return results;
  }

  /**
   * Analyzes an edge (market data) between two currencies.
   * Calculates metrics like Volume Weighted Average Price (VWAP) and recency.
   *
   * @param fromCurrency The source currency ID
   * @param toCurrency The target currency ID
   * @param dataArray Array of market data entries
   * @returns Analysis result including VWAP and volume
   */
  private analyzeEdge<FromCurrency extends string, ToCurrency extends string>(
    fromCurrency: FromCurrency,
    toCurrency: ToCurrency,
    dataArray: MarketData<[FromCurrency, ToCurrency]>[],
  ): EdgeAnalysis {
    let activeData = dataArray;

    if (dataArray.length >= 4) {
      const rates = dataArray
        .map((d) => {
          const vFrom = Number(d.volumeTraded[fromCurrency]);
          const vTo = Number(d.volumeTraded[toCurrency]);
          return vFrom > 0 ? vTo / vFrom : 0;
        })
        .sort((a, b) => a - b);

      const q1 = rates[Math.floor(rates.length * 0.25)];
      const q3 = rates[Math.floor(rates.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;

      activeData = dataArray.filter((d) => {
        if (d.isVendor) {
          return true;
        }
        const rate =
          Number(d.volumeTraded[toCurrency]) /
          Number(d.volumeTraded[fromCurrency]);
        return rate >= lowerBound && rate <= upperBound;
      });
    } else if (dataArray.length > 1) {
      const rates = dataArray
        .map((d) => {
          const vFrom = Number(d.volumeTraded[fromCurrency]);
          const vTo = Number(d.volumeTraded[toCurrency]);
          return vFrom > 0 ? vTo / vFrom : 0;
        })
        .sort((a, b) => a - b);

      const median = rates[Math.floor(rates.length / 2)];

      activeData = dataArray.filter((d) => {
        if (d.isVendor) {
          return true;
        }
        const rate =
          Number(d.volumeTraded[toCurrency]) /
          Number(d.volumeTraded[fromCurrency]);
        return rate <= median * 3 && rate >= median / 3;
      });
    }

    let totalWeightedToVolume = 0;
    let totalWeightedFromVolume = 0;
    let totalFromVolumeRaw = 0n;
    let latestEdgeTime = 0;

    const timeRange = this.maxTimestamp - this.minTimestamp;

    for (const entry of activeData) {
      const entryTime = entry.occurredAt.getTime();
      if (entryTime > latestEdgeTime) {
        latestEdgeTime = entryTime;
      }

      const volFrom = entry.volumeTraded[fromCurrency];
      const volTo = entry.volumeTraded[toCurrency];

      if (volFrom <= 0n || volTo <= 0n) {
        continue;
      }

      let weight = 1.0;
      if (timeRange > 0 && !entry.isVendor) {
        const normalizedTime = (entryTime - this.minTimestamp) / timeRange;
        weight = Math.pow(normalizedTime, 1.5);
      }

      if (entry.isVendor) {
        weight = 1000.0;
      }
      if (weight < 0.01) {
        weight = 0.01;
      }

      totalWeightedFromVolume += Number(volFrom) * weight;
      totalWeightedToVolume += Number(volTo) * weight;

      totalFromVolumeRaw += volFrom;
    }

    const vwap =
      totalWeightedFromVolume > 0
        ? totalWeightedToVolume / totalWeightedFromVolume
        : 0;

    const recencyRatio =
      timeRange === 0 ? 1.0 : (latestEdgeTime - this.minTimestamp) / timeRange;

    return {
      totalVolume: totalFromVolumeRaw,
      vwap,
      recencyRatio,
      lastUpdate: latestEdgeTime,
    };
  }

  /**
   * Calculates a friction value for an edge based on volume and recency.
   * Higher friction edges are less likely to be chosen in the optimal path.
   *
   * @param volume Total volume of the edge
   * @param recencyRatio Ratio of how recent the data is (0-1)
   * @returns Calculated friction score
   */
  private calculateEdgeFriction(volume: bigint, recencyRatio: number): number {
    // Basic transaction cost (one hop)
    const BASE_HOP_PENALTY = 0.02;
    // Volume impact: Higher volume = lower friction.
    // Adjusted to be less punishing: 0.5 / log10(1M) ≈ 0.08
    const volumeCost = 0.5 / Math.log10(Number(volume) + 10);
    // Staleness penalty: Old data (recency 0) adds 2.0 friction (dropping max reliability to ~33%)
    const stalenessPenalty = (1 - recencyRatio) * 2.0;

    return BASE_HOP_PENALTY + volumeCost + stalenessPenalty;
  }
}
