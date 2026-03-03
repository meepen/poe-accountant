import { MinHeap } from "../../utils/min-heap.js";
import type { InferResultType } from "../../connections/db.js";

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

export type MarketData = {
  volFrom: bigint;
  volTo: bigint;
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
  pathNode: PathNode;
  minLiquidity: bigint;
  oldestUpdate: number;
  friction: number;
};

const DirectRateDeviationClamp = 3;
const ReliabilityThreshold = 0.6;
const MAX_PATH_LENGTH = 4;

// Linked list node for path tracking to reduce memory pressure vs arrays
type PathNode = {
  currency: string;
  parent?: PathNode;
  depth: number;
};

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
  private readonly vendorRecipes: readonly VendorRecipe[];

  constructor(markets: MarketInput[], vendorRecipes: readonly VendorRecipe[]) {
    this.vendorRecipes = vendorRecipes;
    console.time("CurrencyGraph:RawDataCollection");
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
        volFrom,
        volTo,
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
        market.history.timestamp,
      );

      // Add Reverse B -> A
      addRaw(
        B,
        A,
        market.toVolume,
        market.fromVolume,
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
    console.timeEnd("CurrencyGraph:RawDataCollection");

    console.time("CurrencyGraph:VendorRecipes");
    // Inject Vendor Recipes (treated as current time)
    // console.timeEnd("CurrencyGraph:RawDataCollection"); // Ends when market data is done, before vendor

    // Actually, let's keep it simple and just mark sections
    const VENDOR_VOLUME = 1_000_000_000n;
    for (const recipe of this.vendorRecipes) {
      const volIn = VENDOR_VOLUME;
      const volOut = BigInt(Math.floor(Number(VENDOR_VOLUME) * recipe.rate));
      addRaw(
        recipe.from,
        recipe.to,
        volIn,
        volOut,
        new Date(this.maxTimestamp),
        true,
      );
    }
    console.timeEnd("CurrencyGraph:VendorRecipes");

    console.time("CurrencyGraph:EdgeAnalysis");
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
    console.timeEnd("CurrencyGraph:EdgeAnalysis");
  }

  /**
   * Calculates optimal exchange rates relative to a stable currency.
   * Uses a modified Dijkstra's algorithm with a Binary Heap.
   */
  public getRatesRelativeTo(
    stableCurrency: string = "chaos",
  ): Map<string, RateResult> {
    const pq = new MinHeap<HeapNode>();
    const minCosts = new Map<string, number>();
    const results = new Map<string, RateResult>();

    const MAX_LIQUIDITY = 9_000_000_000_000_000_000n;

    // Initialization
    pq.push({
      cost: 0,
      currency: stableCurrency,
      rate: 1.0,
      pathNode: { currency: stableCurrency, depth: 1 },
      minLiquidity: MAX_LIQUIDITY,
      oldestUpdate: Date.now(),
      friction: 0,
    });

    let iterations = 0;
    const maxIterations = 200000; // Safety brake

    while (pq.size() > 0) {
      iterations++;
      if (iterations > maxIterations) {
        console.warn(
          "CurrencyGraph.getRatesRelativeTo: Safety brake hit, too many iterations",
        );
        break;
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const node = pq.pop()!;
      const {
        cost,
        currency: currentCurrency,
        rate: currentRate,
        pathNode,
        minLiquidity,
        oldestUpdate,
        friction,
      } = node;

      if (pathNode.depth > MAX_PATH_LENGTH) {
        continue;
      }

      let isSafe = 1 / (1 + friction) >= ReliabilityThreshold;
      const costKey = `${currentCurrency}:${isSafe ? "safe" : "unsafe"}`;

      // Pruning
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (minCosts.has(costKey) && minCosts.get(costKey)! < cost) {
        continue;
      }

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

      const reliabilityFraction = 1 / (1 + friction);
      let reliability = reliabilityFraction * 100;
      const existing = results.get(currentCurrency);
      const existingIsSafe =
        (existing?.reliability ?? 0) >= ReliabilityThreshold * 100;

      let selectedRate = currentRate;
      let selectedPathNode = pathNode;
      if (
        directRate &&
        directRate > 0 &&
        reliabilityFraction < ReliabilityThreshold
      ) {
        const ratio = currentRate / directRate;
        selectedRate = directRate;
        selectedPathNode = {
          currency: stableCurrency,
          depth: 2,
          parent: { currency: currentCurrency, depth: 1 },
        };
        // If we fallback to direct rate, we consider it 100% reliable as it is the "market price"
        reliability = 100;
        isSafe = true;

        if (
          Number.isFinite(ratio) &&
          ratio <= DirectRateDeviationClamp &&
          ratio >= 1 / DirectRateDeviationClamp
        ) {
          selectedRate = currentRate;
          selectedPathNode = pathNode;
          // Revert reliability if we revert to calculated rate
          reliability = reliabilityFraction * 100;
          isSafe = reliabilityFraction >= ReliabilityThreshold;
        }
      }

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

      // Persistence Logic:
      // 1. If no existing result, save.
      // 2. If existing is Unsafe and we are Safe, overwrite.
      // 3. Otherwise (Safe->Safe, Unsafe->Unsafe, Safe->Unsafe), keep existing (First is Best Price).
      if (!existing || (!existingIsSafe && isSafe)) {
        // Construct path array only when persisting result
        const constructedPath: string[] = [];
        let curr: PathNode | undefined = selectedPathNode;
        while (curr) {
          constructedPath.push(curr.currency);
          curr = curr.parent;
        }
        // Since we build it backwards (Current -> ... -> Start), reverse it to get (Start -> ... -> Current)
        // Actually, the original 'path' was [Start, ..., Current].
        // Node: { currency: "chaos", depth: 1 } -> { currency: "divine", depth: 2, parent: ... }
        // We are at currentCurrency.
        // Wait, the logic pushes [...path, sourceCurrency].
        // So original path was [Stable, ..., Current].
        // My linked list is Current -> Parent (Stable).
        // So constructedPath is [Current, ..., Stable].
        // We want [Current, ..., Stable] for display?
        // Original code: path: selectedPath
        // selectedPath was logic: [Start, ..., Current].
        // Wait, 'path' in node is [Start, ..., Current].
        // Let's verify 'path' usage.
        // Initialization: [stableCurrency].
        // Expansion: [...selectedPath, sourceCurrency]. (Source is neighbor).
        // Wait, we are traversing *backwards* from Stable via Incoming Edges.
        // Stable -> Source -> ... -> Current.
        // Actually, 'path' accumulates the route taken from Stable to Current.
        // So [Stable, Node1, Node2, Current].

        // My Linked List: current -> parent (which is node popped from queue).
        // So `selectedPathNode` is (Current). Parent is (Predecessor towards Stable).
        // Traversal gives: Current, Predecessor, ..., Stable.
        // So result is [Current, ..., Stable].
        // Original 'path' was [Stable, ..., Current].
        // So I should reverse `constructedPath` to match previous behavior if expected.
        // Let's check: path: selectedRate !== currentRate ? [current, stable] ...
        // Reversal seems correct to match original [Stable -> Current].

        results.set(currentCurrency, {
          currency: currentCurrency,
          optimalRate: selectedRate,
          directRate: directRate,
          arbitragePercentage: Number(arbitragePercentage.toFixed(2)),
          path: constructedPath.reverse(),
          reliability: Number(reliability.toFixed(1)),
          roundTripRate: Number(roundTripRate.toFixed(4)),
          roundTripLiquidity: exitLiquidity,
          liquidity: minLiquidity,
          lastUpdate: new Date(oldestUpdate),
        });
      }

      // --- 2. Traverse Neighbors (Optimized) ---
      // We are looking for: Source -> Current (How did we get here?)
      // We check the Incoming Graph.

      const sources = this.incomingEdges.get(currentCurrency);

      if (sources) {
        for (const [sourceCurrency, edge] of sources.entries()) {
          // Cycle prevention logic
          let inPath = false;
          let temp: PathNode | undefined = selectedPathNode;
          // Only check up to MAX_PATH_LENGTH to avoid infinite loops if cycle exists despite depth constraint
          // Though depth constraint handles it mostly, cycle check handles shorter cycles.
          while (temp) {
            if (temp.currency === sourceCurrency) {
              inPath = true;
              break;
            }
            temp = temp.parent;
          }
          if (inPath) {
            continue;
          }

          // Algorithm Math (using pre-calculated edge)
          // Use selectedRate to propagate the "Trusted" value (or clamped value)
          const newRate = selectedRate * edge.vwap;

          // Cost Calculation
          const priceScore = -Math.log(edge.vwap);
          const edgeFriction = edge.friction; // Already calculated

          const newCost = cost + priceScore + edgeFriction * 0.1;
          const newFriction = friction + edgeFriction;
          const newIsSafe = 1 / (1 + newFriction) >= ReliabilityThreshold;
          const newCostKey = `${sourceCurrency}:${newIsSafe ? "safe" : "unsafe"}`;

          if (
            minCosts.has(newCostKey) &&
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            minCosts.get(newCostKey)! <= newCost
          ) {
            continue;
          }
          minCosts.set(newCostKey, newCost);

          const newLiquidity =
            edge.totalVolume < minLiquidity ? edge.totalVolume : minLiquidity;
          const newOldestUpdate =
            edge.lastUpdate < oldestUpdate ? edge.lastUpdate : oldestUpdate;

          pq.push({
            cost: newCost,
            currency: sourceCurrency,
            rate: newRate,
            pathNode: {
              currency: sourceCurrency,
              parent: selectedPathNode,
              depth: selectedPathNode.depth + 1,
            },
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
    if (dataArray.length === 0) {
      return this.emptyAnalysis();
    }

    // Single pass to extract rates and prepare for analysis
    // We store the rate with the data to avoid recalculation
    const entries: {
      data: MarketData;
      rate: number;
      vFrom: number;
      vTo: number;
    }[] = [];
    const validRates: number[] = [];

    for (let i = 0; i < dataArray.length; i++) {
      const d = dataArray[i];
      const vFrom = Number(d.volFrom);
      const vTo = Number(d.volTo);
      let rate = 0;

      if (vFrom > 0) {
        rate = vTo / vFrom;
        if (!Number.isFinite(rate)) {
          rate = 0;
        }
      }

      entries.push({ data: d, rate, vFrom, vTo });

      // Only include valid rates in the stats calculation
      if (rate > 0) {
        validRates.push(rate);
      }
    }

    // Determine bounds based on distribution
    let minBound = -Infinity;
    let maxBound = Infinity;
    const count = validRates.length;

    if (count >= 4) {
      // outlier filtration (IQR)
      validRates.sort((a, b) => a - b);
      const q1 = validRates[Math.floor(count * 0.25)];
      const q3 = validRates[Math.floor(count * 0.75)];
      const iqr = q3 - q1;
      minBound = q1 - 1.5 * iqr;
      maxBound = q3 + 1.5 * iqr;
    } else if (count > 1) {
      // basic median filter
      validRates.sort((a, b) => a - b);
      const median = validRates[Math.floor(count / 2)];
      minBound = median / 3;
      maxBound = median * 3;
    } else if (count === 0 && dataArray.length > 0) {
      // Check if we have vendor items which might not have generated valid rates
      // (though unlikely unless vFrom=0, effectively impossible for a valid trade)
      // If no valid rates exist, we can only rely on vendor items or fail.
      let hasVendor = false;
      for (const e of entries) {
        if (e.data.isVendor) {
          hasVendor = true;
          break;
        }
      }
      if (!hasVendor) {
        return this.emptyAnalysis();
      }
    }

    let totalWeightedToVolume = 0;
    let totalWeightedFromVolume = 0;
    let totalFromVolumeRaw = 0n;
    let latestEdgeTime = 0;

    const timeRange = this.maxTimestamp - this.minTimestamp;
    const hasTimeRange = timeRange > 0;

    for (let i = 0; i < entries.length; i++) {
      const { data, rate, vFrom, vTo } = entries[i];

      // Vendor items are always included.
      // Non-vendor items must be within bounds and have a positive rate.
      const isIncluded =
        data.isVendor || (rate > 0 && rate >= minBound && rate <= maxBound);

      if (!isIncluded) {
        continue;
      }

      const entryTime = data.occurredAt.getTime();
      if (entryTime > latestEdgeTime) {
        latestEdgeTime = entryTime;
      }

      if (vFrom <= 0 || vTo <= 0) {
        // Should catch vFrom <= 0 from rate calc, but vTo could be 0
        continue;
      }

      let weight = 1.0;
      if (hasTimeRange && !data.isVendor) {
        const normalizedTime = (entryTime - this.minTimestamp) / timeRange;
        // Optimization: simple multiplication instead of Math.pow if possible?
        // Original was Math.pow(x, 1.5). We'll keep it for now.
        weight = Math.pow(normalizedTime, 1.5);
      }

      if (data.isVendor) {
        weight = 1000.0;
      }

      // Clamp weight
      if (weight < 0.01) {
        weight = 0.01;
      }

      totalWeightedFromVolume += vFrom * weight;
      totalWeightedToVolume += vTo * weight;
      // Access raw BigInt from data for the total request
      totalFromVolumeRaw += data.volFrom || 0n;
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
