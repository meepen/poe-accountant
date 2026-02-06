import { InferResultType } from "../../connections/db.js";

// --- Types ---

export interface MarketInput {
  fromCurrency: string;
  toCurrency: string;
  fromVolume: bigint;
  toVolume: bigint;
  lowestRatio: number;
  highestRatio: number;
  history: {
    timestamp: Date;
  };
}

export type CurrencyExchangeWithRelations = InferResultType<
  "CurrencyExchangeHistoryCurrency",
  {
    with: {
      history: true;
    };
  }
>;

type TimeSeries<
  NumberType extends bigint | number,
  Currencies extends string[] = [string, string],
> = Record<Currencies[number], NumberType>;

export type MarketData<Currencies extends string[] = [string, string]> = {
  volumeTraded: TimeSeries<bigint, Currencies>;
  lowestRatio: TimeSeries<number, Currencies>;
  occurredAt: Date;
  isVendor?: boolean;
};

export type VendorRecipe = {
  from: string;
  to: string;
  rate: number;
};

/**
 * Optimized edge data, pre-calculated during initialization.
 */
interface ProcessedEdge {
  vwap: number;
  totalVolume: bigint;
  recencyRatio: number;
  lastUpdate: number;
  friction: number; // Pre-calculated cost penalty
}

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

type HeapNode = {
  cost: number;
  currency: string;
  rate: number;
  path: string[];
  minLiquidity: bigint;
  oldestUpdate: number;
  friction: number;
};

class MinHeap {
  private heap: HeapNode[] = [];

  push(node: HeapNode) {
    this.heap.push(node);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): HeapNode | undefined {
    if (this.heap.length === 0) {
      return undefined;
    }
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (this.heap.length > 0 && bottom) {
      this.heap[0] = bottom;
      this.sinkDown(0);
    }
    return top;
  }

  size(): number {
    return this.heap.length;
  }

  private bubbleUp(index: number) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[index].cost >= this.heap[parentIndex].cost) {
        break;
      }
      [this.heap[index], this.heap[parentIndex]] = [
        this.heap[parentIndex],
        this.heap[index],
      ];
      index = parentIndex;
    }
  }

  private sinkDown(index: number) {
    const length = this.heap.length;
    const element = this.heap[index];
    for (;;) {
      const leftChildIdx = 2 * index + 1;
      const rightChildIdx = 2 * index + 2;
      let leftChild, rightChild;
      let swap = null;

      if (leftChildIdx < length) {
        leftChild = this.heap[leftChildIdx];
        if (leftChild.cost < element.cost) {
          swap = leftChildIdx;
        }
      }

      if (rightChildIdx < length) {
        rightChild = this.heap[rightChildIdx];
        if (
          (swap === null && rightChild.cost < element.cost) ||
          (swap !== null && leftChild && rightChild.cost < leftChild.cost)
        ) {
          swap = rightChildIdx;
        }
      }

      if (swap === null) {
        break;
      }
      [this.heap[index], this.heap[swap]] = [this.heap[swap], this.heap[index]];
      index = swap;
    }
  }
}

// --- Main Class ---

/**
 * Graph structure representing currency exchange markets.
 * Capable of finding optimal exchange paths and calculating rates.
 */
export class CurrencyGraph {
  // Map<ToCurrency, Map<FromCurrency, ProcessedEdge>>
  private incomingEdges: Map<string, Map<string, ProcessedEdge>> = new Map();

  // We keep a forward map specifically for "Direct Rate" lookups in the final result step
  private forwardEdges: Map<string, Map<string, ProcessedEdge>> = new Map();

  private minTimestamp: number;
  private maxTimestamp: number;

  constructor(
    markets: MarketInput[],
    private readonly vendorRecipes: readonly VendorRecipe[],
  ) {
    // 1. Temporary Raw Data Collection
    // We must group all raw entries first before analyzing edges
    const rawGraph: Record<string, Record<string, MarketData[]>> = {};

    let globalMin = Infinity;
    let globalMax = -Infinity;
    let hasData = false;

    const addRaw = (
      from: string,
      to: string,
      volFrom: bigint,
      volTo: bigint,
      ratioFrom: number,
      ratioTo: number,
      timestamp: Date,
      isVendor = false,
    ) => {
      if (!(from in rawGraph)) {
        rawGraph[from] = {};
      }
      if (!(to in rawGraph[from])) {
        rawGraph[from][to] = [];
      }

      const time = timestamp.getTime();
      if (time < globalMin) {
        globalMin = time;
      }
      if (time > globalMax) {
        globalMax = time;
      }
      hasData = true;

      rawGraph[from][to].push({
        volumeTraded: { [from]: volFrom, [to]: volTo },
        lowestRatio: { [from]: ratioFrom, [to]: ratioTo },
        occurredAt: timestamp,
        isVendor,
      });
    };

    // Process Database Markets
    for (const market of markets) {
      const A = market.fromCurrency;
      const B = market.toCurrency;

      // Add Forward A -> B
      addRaw(
        A,
        B,
        market.fromVolume,
        market.toVolume,
        market.lowestRatio,
        market.highestRatio,
        market.history.timestamp,
      );

      // Add Reverse B -> A
      const safeLow = market.lowestRatio > 0 ? market.lowestRatio : 1;
      const safeHigh = market.highestRatio > 0 ? market.highestRatio : 1;
      addRaw(
        B,
        A,
        market.toVolume,
        market.fromVolume,
        1 / safeHigh,
        1 / safeLow,
        market.history.timestamp,
      );
    }

    // Initialize Time Bounds
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!hasData) {
      this.minTimestamp = Date.now();
      this.maxTimestamp = Date.now();
    } else {
      this.minTimestamp = globalMin;
      this.maxTimestamp = globalMax;
    }

    // Inject Vendor Recipes (treated as current time)
    const VENDOR_VOLUME = 1_000_000_000n;
    for (const recipe of this.vendorRecipes) {
      const volIn = VENDOR_VOLUME;
      const volOut = BigInt(Math.floor(Number(VENDOR_VOLUME) * recipe.rate));
      addRaw(
        recipe.from,
        recipe.to,
        volIn,
        volOut,
        recipe.rate,
        recipe.rate,
        new Date(this.maxTimestamp),
        true,
      );
    }

    // 2. Process Edges (Pre-calculation)
    // Convert raw data arrays into single ProcessedEdge objects
    for (const fromCurrency in rawGraph) {
      for (const toCurrency in rawGraph[fromCurrency]) {
        const dataArray = rawGraph[fromCurrency][toCurrency];

        // Analyze the edge ONCE here
        const analysis = this.analyzeEdge(fromCurrency, toCurrency, dataArray);

        // Filter out dead edges immediately
        if (analysis.totalVolume <= 0n || analysis.vwap <= 0) {
          continue;
        }

        const friction = this.calculateEdgeFriction(
          analysis.totalVolume,
          analysis.recencyRatio,
        );

        const processed: ProcessedEdge = {
          ...analysis,
          friction,
        };

        // Store in Incoming Graph (To -> From) for Dijkstra
        if (!this.incomingEdges.has(toCurrency)) {
          this.incomingEdges.set(toCurrency, new Map());
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.incomingEdges.get(toCurrency)!.set(fromCurrency, processed);

        // Store in Forward Graph (From -> To) for direct rate lookup
        if (!this.forwardEdges.has(fromCurrency)) {
          this.forwardEdges.set(fromCurrency, new Map());
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.forwardEdges.get(fromCurrency)!.set(toCurrency, processed);
      }
    }
  }

  /**
   * Calculates optimal exchange rates relative to a stable currency.
   * Uses a modified Dijkstra's algorithm with a Binary Heap.
   */
  public getRatesRelativeTo(
    stableCurrency: string = "chaos",
  ): Map<string, RateResult> {
    const pq = new MinHeap();
    const minCosts = new Map<string, number>();
    const results = new Map<string, RateResult>();
    const visited = new Set<string>();

    const MAX_LIQUIDITY = 9_000_000_000_000_000_000n;

    // Initialization
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

    while (pq.size() > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const node = pq.pop()!;
      const {
        cost,
        currency: currentCurrency,
        rate: currentRate,
        path,
        minLiquidity,
        oldestUpdate,
        friction,
      } = node;

      // Pruning
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

      // --- 1. Result Construction ---
      // We perform the final metric checks here using the pre-built Forward Graph

      let directRate: number | null = null;
      let exitLiquidity = 0n;

      if (currentCurrency === stableCurrency) {
        directRate = 1.0;
        exitLiquidity = MAX_LIQUIDITY;
      } else {
        // Direct Path: Current -> Stable
        const forwardEdge = this.forwardEdges
          .get(currentCurrency)
          ?.get(stableCurrency);
        if (forwardEdge && forwardEdge.vwap > 0) {
          directRate = forwardEdge.vwap;
          exitLiquidity = forwardEdge.totalVolume;
        } else {
          // Reverse Fallback: Stable -> Current (Inverted)
          const reverseEdge = this.forwardEdges
            .get(stableCurrency)
            ?.get(currentCurrency);
          if (reverseEdge && reverseEdge.vwap > 0) {
            directRate = 1.0 / reverseEdge.vwap;
          }
        }
      }

      const arbitragePercentage =
        directRate && directRate > 0
          ? ((currentRate - directRate) / directRate) * 100
          : 0;

      const reliability = 100 / (1 + friction);

      // Calculate Exit Rate (Selling to Stable)
      let exitRate = 0;
      if (currentCurrency === stableCurrency) {
        exitRate = 1.0;
      } else {
        const forwardEdge = this.forwardEdges
          .get(currentCurrency)
          ?.get(stableCurrency);
        if (forwardEdge) {
          exitRate = forwardEdge.vwap;
        }
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

      // --- 2. Traverse Neighbors (Optimized) ---
      // We are looking for: Source -> Current (How did we get here?)
      // We check the Incoming Graph.

      const sources = this.incomingEdges.get(currentCurrency);

      if (sources) {
        for (const [sourceCurrency, edge] of sources.entries()) {
          // Cycle prevention
          if (path.includes(sourceCurrency)) {
            continue;
          }

          // Algorithm Math (using pre-calculated edge)
          const newRate = currentRate * edge.vwap;

          // Cost Calculation
          const priceScore = -Math.log(edge.vwap);
          const edgeFriction = edge.friction; // Already calculated

          const newCost = cost + priceScore + edgeFriction * 0.1;
          const newFriction = friction + edgeFriction;

          if (
            minCosts.has(sourceCurrency) &&
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            minCosts.get(sourceCurrency)! <= newCost
          ) {
            continue;
          }
          minCosts.set(sourceCurrency, newCost);

          const newLiquidity =
            edge.totalVolume < minLiquidity ? edge.totalVolume : minLiquidity;
          const newOldestUpdate =
            edge.lastUpdate < oldestUpdate ? edge.lastUpdate : oldestUpdate;

          pq.push({
            cost: newCost,
            currency: sourceCurrency,
            rate: newRate,
            path: [sourceCurrency, ...path], // Prepend source
            minLiquidity: newLiquidity,
            oldestUpdate: newOldestUpdate,
            friction: newFriction,
          });
        }
      }
    }

    return results;
  }

  /**
   * Internal helper to analyze raw edge data.
   * This is now only called inside the constructor.
   */
  private analyzeEdge(
    fromCurrency: string,
    toCurrency: string,
    dataArray: MarketData[],
  ): Omit<ProcessedEdge, "friction"> {
    let activeData = dataArray;

    // Outlier Filtration (IQR)
    if (dataArray.length >= 4) {
      const rates = dataArray
        .map((d) => {
          const vFrom = Number(d.volumeTraded[fromCurrency]);
          const vTo = Number(d.volumeTraded[toCurrency]);
          const rate = vFrom > 0 ? vTo / vFrom : 0;
          return Number.isFinite(rate) ? rate : 0;
        })
        .filter((rate) => rate > 0)
        .sort((a, b) => a - b);

      if (rates.length === 0) {
        return this.emptyAnalysis();
      }

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
        if (!Number.isFinite(rate) || rate <= 0) {
          return false;
        }
        return rate >= lowerBound && rate <= upperBound;
      });
    } else if (dataArray.length > 1) {
      // Basic Median Filter for small datasets
      const rates = dataArray
        .map((d) => {
          const vFrom = Number(d.volumeTraded[fromCurrency]);
          const vTo = Number(d.volumeTraded[toCurrency]);
          const rate = vFrom > 0 ? vTo / vFrom : 0;
          return Number.isFinite(rate) ? rate : 0;
        })
        .filter((rate) => rate > 0)
        .sort((a, b) => a - b);

      if (rates.length === 0) {
        return this.emptyAnalysis();
      }

      const median = rates[Math.floor(rates.length / 2)];

      activeData = dataArray.filter((d) => {
        if (d.isVendor) {
          return true;
        }
        const rate =
          Number(d.volumeTraded[toCurrency]) /
          Number(d.volumeTraded[fromCurrency]);
        if (!Number.isFinite(rate) || rate <= 0) {
          return false;
        }
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

  private emptyAnalysis(): Omit<ProcessedEdge, "friction"> {
    return {
      totalVolume: 0n,
      vwap: 0,
      recencyRatio: 0,
      lastUpdate: 0,
    };
  }

  private calculateEdgeFriction(volume: bigint, recencyRatio: number): number {
    const BASE_HOP_PENALTY = 0.02;
    const volumeCost = 0.5 / Math.log10(Number(volume) + 10);
    const stalenessPenalty = (1 - recencyRatio) * 2.0;
    return BASE_HOP_PENALTY + volumeCost + stalenessPenalty;
  }
}
