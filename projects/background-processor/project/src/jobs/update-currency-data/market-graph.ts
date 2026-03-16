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

interface ProcessedEdge {
  vwap: number;
  totalVolume: bigint;
  recencyRatio: number;
  lastUpdate: number;
  friction: number;
  isVendor: boolean;
}

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

// Flat structure to prevent massive object allocation overhead
class EdgeData {
  vFroms: number[] = [];
  vTos: number[] = [];
  times: number[] = [];
  isVendor: boolean[] = [];
  rawVolFroms: bigint[] = [];
}

type SPFAQueueNode = {
  cost: number;
  currency: string;
  rate: number;
  path: string[];
  minLiquidity: bigint;
  oldestUpdate: number;
  friction: number;
  depth: number;
};

const DirectRateDeviationClamp = 3;
const ReliabilityThreshold = 0.6;
const MAX_PATH_LENGTH = 5;
const MAX_GRAPH_ITERATIONS = 50_000;

// --- Main Class ---

export class CurrencyGraph {
  private incomingEdges: Map<string, Map<string, ProcessedEdge>> = new Map();
  private forwardEdges: Map<string, Map<string, ProcessedEdge>> = new Map();

  private minTimestamp: number = Date.now();
  private maxTimestamp: number = Date.now();

  constructor(
    markets: MarketInput[],
    private readonly vendorRecipes: readonly VendorRecipe[],
  ) {
    console.time("CurrencyGraph:RawDataCollection");

    const rawEdges = new Map<string, Map<string, EdgeData>>();
    let globalMin = Infinity;
    let globalMax = -Infinity;

    const getEdgeData = (from: string, to: string) => {
      let toMap = rawEdges.get(from);
      if (!toMap) {
        toMap = new Map();
        rawEdges.set(from, toMap);
      }
      let data = toMap.get(to);
      if (!data) {
        data = new EdgeData();
        toMap.set(to, data);
      }
      return data;
    };

    const addRaw = (
      from: string,
      to: string,
      volFrom: bigint,
      volTo: bigint,
      timestamp: Date,
      isVendor = false,
    ) => {
      const time = timestamp.getTime();
      if (time < globalMin) {
        globalMin = time;
      }
      if (time > globalMax) {
        globalMax = time;
      }

      const data = getEdgeData(from, to);
      data.vFroms.push(Number(volFrom));
      data.vTos.push(Number(volTo));
      data.times.push(time);
      data.isVendor.push(isVendor);
      data.rawVolFroms.push(volFrom);
    };

    for (const market of markets) {
      addRaw(
        market.fromCurrency,
        market.toCurrency,
        market.fromVolume,
        market.toVolume,
        market.history.timestamp,
      );
      addRaw(
        market.toCurrency,
        market.fromCurrency,
        market.toVolume,
        market.fromVolume,
        market.history.timestamp,
      );
    }

    if (Number.isFinite(globalMin) && Number.isFinite(globalMax)) {
      this.minTimestamp = globalMin;
      this.maxTimestamp = globalMax;
    }
    console.timeEnd("CurrencyGraph:RawDataCollection");

    console.time("CurrencyGraph:VendorRecipes");
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
    for (const [fromCurrency, toMap] of rawEdges.entries()) {
      for (const [toCurrency, edgeData] of toMap.entries()) {
        const analysis = this.analyzeEdge(edgeData);

        if (analysis.totalVolume <= 0n || analysis.vwap <= 0) {
          continue;
        }

        const friction = this.calculateEdgeFriction(
          analysis.totalVolume,
          analysis.recencyRatio,
        );
        const processed: ProcessedEdge = { ...analysis, friction };

        if (!this.incomingEdges.has(toCurrency)) {
          this.incomingEdges.set(toCurrency, new Map());
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.incomingEdges.get(toCurrency)!.set(fromCurrency, processed);

        if (!this.forwardEdges.has(fromCurrency)) {
          this.forwardEdges.set(fromCurrency, new Map());
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.forwardEdges.get(fromCurrency)!.set(toCurrency, processed);
      }
    }
    console.timeEnd("CurrencyGraph:EdgeAnalysis");
  }

  public getRatesRelativeTo(
    stableCurrency: string = "chaos",
  ): Map<string, RateResult> {
    // SPFA Queue replaces Dijkstra's Priority Queue to safely handle negative math logs
    const queue: SPFAQueueNode[] = [];
    let head = 0;

    const minCosts = new Map<string, number>();
    const results = new Map<string, RateResult>();
    const bestCostsForResults = new Map<string, number>();

    const MAX_LIQUIDITY = 9_000_000_000_000_000_000n;

    queue.push({
      cost: 0,
      currency: stableCurrency,
      rate: 1.0,
      path: [stableCurrency],
      minLiquidity: MAX_LIQUIDITY,
      oldestUpdate: Date.now(),
      friction: 0,
      depth: 1,
    });

    minCosts.set(`${stableCurrency}:safe`, 0);
    let iterations = 0;

    while (head < queue.length) {
      iterations++;
      if (iterations > MAX_GRAPH_ITERATIONS) {
        console.warn(
          "CurrencyGraph.getRatesRelativeTo: Safety brake hit, too many iterations",
        );
        break;
      }

      const node = queue[head++];
      const {
        cost,
        currency: currentCurrency,
        rate: currentRate,
        path,
        minLiquidity,
        oldestUpdate,
        friction,
        depth,
      } = node;

      let isSafe = 1 / (1 + friction) >= ReliabilityThreshold;

      // --- 1. Result Construction ---
      let directRate: number | null = null;
      let exitLiquidity = 0n;

      if (currentCurrency === stableCurrency) {
        directRate = 1.0;
        exitLiquidity = MAX_LIQUIDITY;
      } else {
        const forwardEdge = this.forwardEdges
          .get(currentCurrency)
          ?.get(stableCurrency);
        if (forwardEdge && forwardEdge.vwap > 0) {
          directRate = forwardEdge.vwap;
          exitLiquidity = forwardEdge.totalVolume;
        } else {
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

      let selectedRate = currentRate;
      let selectedPath = path;

      if (
        directRate &&
        directRate > 0 &&
        reliabilityFraction < ReliabilityThreshold
      ) {
        const ratio = currentRate / directRate;
        selectedRate = directRate;
        selectedPath = [currentCurrency, stableCurrency];
        reliability = 100;
        isSafe = true;

        if (
          Number.isFinite(ratio) &&
          ratio <= DirectRateDeviationClamp &&
          ratio >= 1 / DirectRateDeviationClamp
        ) {
          selectedRate = currentRate;
          selectedPath = path;
          reliability = reliabilityFraction * 100;
          isSafe = reliabilityFraction >= ReliabilityThreshold;
        }
      }

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

      const existing = results.get(currentCurrency);
      const existingCost = bestCostsForResults.get(currentCurrency) ?? Infinity;
      const existingIsSafe =
        (existing?.reliability ?? 0) >= ReliabilityThreshold * 100;

      let shouldUpdate = false;
      if (!existing) {
        shouldUpdate = true;
      } else if (!existingIsSafe && isSafe) {
        shouldUpdate = true;
      } else if (isSafe === existingIsSafe && cost < existingCost) {
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        bestCostsForResults.set(currentCurrency, cost);
        results.set(currentCurrency, {
          currency: currentCurrency,
          optimalRate: selectedRate,
          directRate: directRate,
          arbitragePercentage: Number(arbitragePercentage.toFixed(2)),
          path: selectedPath,
          reliability: Number(reliability.toFixed(1)),
          roundTripRate: Number(roundTripRate.toFixed(4)),
          roundTripLiquidity: exitLiquidity,
          liquidity: minLiquidity,
          lastUpdate: new Date(oldestUpdate),
        });
      }

      // --- 2. Traverse Neighbors ---
      if (depth >= MAX_PATH_LENGTH) {
        continue;
      }

      const sources = this.incomingEdges.get(currentCurrency);
      if (sources) {
        for (const [sourceCurrency, edge] of sources.entries()) {
          if (path.includes(sourceCurrency)) {
            continue;
          } // Cycle prevention

          const newRate = selectedRate * edge.vwap;
          if (!Number.isFinite(newRate) || newRate <= 0) {
            continue;
          }

          const priceScore = -Math.log(edge.vwap);
          const edgeFriction = edge.friction;
          const isVendor = edge.isVendor;

          // Penalize friction based on depth to prefer shorter paths (exponential falloff)
          // Vendor recipes don't contribute to depth penalty accumulation
          const depthPenalty = isVendor ? 1 : Math.pow(1.5, depth - 1);
          const effectiveFriction = edgeFriction * depthPenalty;

          const newCost = cost + priceScore + effectiveFriction;
          if (!Number.isFinite(newCost)) {
            continue;
          }

          const newFriction = friction + effectiveFriction;
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

          // Don't increment depth for vendor recipes
          const nextDepth = isVendor ? depth : depth + 1;

          queue.push({
            cost: newCost,
            currency: sourceCurrency,
            rate: newRate,
            path: [sourceCurrency, ...selectedPath],
            minLiquidity: newLiquidity,
            oldestUpdate: newOldestUpdate,
            friction: newFriction,
            depth: nextDepth,
          });
        }
      }
    }

    return results;
  }

  private analyzeEdge(data: EdgeData): Omit<ProcessedEdge, "friction"> {
    const len = data.vFroms.length;
    if (len === 0) {
      return this.emptyAnalysis();
    }

    const validRates: number[] = [];
    const rates = new Float64Array(len);

    for (let i = 0; i < len; i++) {
      const vFrom = data.vFroms[i];
      const vTo = data.vTos[i];
      let rate = 0;

      if (vFrom > 0) {
        rate = vTo / vFrom;
        if (!Number.isFinite(rate)) {
          rate = 0;
        }
      }

      rates[i] = rate;
      if (rate > 0) {
        validRates.push(rate);
      }
    }

    let minBound = -Infinity;
    let maxBound = Infinity;
    const count = validRates.length;

    if (count >= 4) {
      validRates.sort((a, b) => a - b);
      const q1 = validRates[Math.floor(count * 0.25)];
      const q3 = validRates[Math.floor(count * 0.75)];
      const iqr = q3 - q1;
      minBound = q1 - 1.5 * iqr;
      maxBound = q3 + 1.5 * iqr;
    } else if (count > 1) {
      validRates.sort((a, b) => a - b);
      const median = validRates[Math.floor(count / 2)];
      minBound = median / 3;
      maxBound = median * 3;
    } else if (count === 0 && len > 0) {
      let hasVendor = false;
      for (let i = 0; i < len; i++) {
        if (data.isVendor[i]) {
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
    let edgeIsVendor = false;

    const timeRange = this.maxTimestamp - this.minTimestamp;
    const hasTimeRange = timeRange > 0;

    for (let i = 0; i < len; i++) {
      const rate = rates[i];
      const isVendor = data.isVendor[i];
      const isIncluded =
        isVendor || (rate > 0 && rate >= minBound && rate <= maxBound);

      if (!isIncluded) {
        continue;
      }

      if (isVendor) {
        edgeIsVendor = true;
      }

      const entryTime = data.times[i];
      if (entryTime > latestEdgeTime) {
        latestEdgeTime = entryTime;
      }

      const vFrom = data.vFroms[i];
      const vTo = data.vTos[i];
      if (vFrom <= 0 || vTo <= 0) {
        continue;
      }

      let weight = 1.0;
      if (hasTimeRange && !isVendor) {
        const normalizedTime = (entryTime - this.minTimestamp) / timeRange;
        weight = Math.pow(normalizedTime, 1.5);
      }
      if (isVendor) {
        weight = 1000.0;
      }
      if (weight < 0.01) {
        weight = 0.01;
      }

      totalWeightedFromVolume += vFrom * weight;
      totalWeightedToVolume += vTo * weight;
      totalFromVolumeRaw += data.rawVolFroms[i];
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
      isVendor: edgeIsVendor,
    };
  }

  private emptyAnalysis(): Omit<ProcessedEdge, "friction"> {
    return {
      totalVolume: 0n,
      vwap: 0,
      recencyRatio: 0,
      lastUpdate: 0,
      isVendor: false,
    };
  }

  private calculateEdgeFriction(volume: bigint, recencyRatio: number): number {
    const BASE_HOP_PENALTY = 0.02;
    const volumeCost = 0.5 / Math.log10(Number(volume) + 10);
    const stalenessPenalty = (1 - recencyRatio) * 2.0;
    return BASE_HOP_PENALTY + volumeCost + stalenessPenalty;
  }
}
