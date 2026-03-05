import { Hono } from "hono";
import { valkeyCache } from "../utils/cache";
import { ApiEndpoint } from "@meepen/poe-accountant-api-schema/api/api-endpoints";
import {
  StaticTradeDataSnapshotRedisKey,
  StaticTradeDataSnapshotDto,
} from "@meepen/poe-accountant-api-schema";
import {
  CurrencyExchangeHistory,
  CurrencyExchangeLeagueSnapshotData,
} from "@meepen/poe-accountant-db-schema";
import { and, desc, eq } from "drizzle-orm";
import type { IndexEnv } from "..";
import type z from "zod";

export const prices = new Hono<IndexEnv>();

ApiEndpoint.GetExchangeRatesCurrency satisfies {
  path: "prices/exchange-rates/:realm/:leagueId/currency/:currency";
  method: "GET";
};

prices.get(
  "/exchange-rates/:realm/:leagueId/currency/:currency",
  valkeyCache({
    ttl() {
      const livesUntil = new Date();
      livesUntil.setMinutes(0, 0, 0);
      livesUntil.setHours(livesUntil.getHours() + 1);
      return Math.floor((livesUntil.getTime() - Date.now()) / 1000);
    },
    keyPrefix: "exchange-rates:currency",
  }),
  async (c) => {
    const { realm, leagueId, currency } = c.req.param();

    const db = c.get("db");

    const result = await db.query.CurrencyExchangeHistory.findFirst({
      where: (history, { eq, and }) =>
        and(eq(history.realm, realm), eq(history.leagueId, leagueId)),
      orderBy: (history, { desc }) => [desc(history.timestamp)],
      with: {
        snapshotData: {
          where: (data, { eq }) => eq(data.currency, currency),
          limit: 1,
        },
      },
    });

    if (!result || result.snapshotData.length === 0) {
      return c.notFound();
    }

    return c.json({
      ...result.snapshotData[0],
      liquidity: result.snapshotData[0].liquidity.toString(),
    });
  },
);

ApiEndpoint.GetExchangeRatesCurrencyHistorical satisfies {
  path: "prices/exchange-rates/:realm/:leagueId/currency/:currency/historical";
  method: "GET";
};
prices.get(
  "/exchange-rates/:realm/:leagueId/currency/:currency/historical",
  async (c) => {
    // for now get the last 5 days of data and return it
    const { realm, leagueId, currency } = c.req.param();

    const db = c.get("db");

    const results = await db.query.CurrencyExchangeHistory.findMany({
      where: (data, { eq, and, gte }) =>
        and(
          eq(data.realm, realm),
          eq(data.leagueId, leagueId),
          gte(data.timestamp, new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
        ),
      orderBy: (history, { desc }) => [desc(history.timestamp)],
      with: {
        snapshotData: {
          where: (data, { eq }) => eq(data.currency, currency),
        },
      },
    });

    if (results.length === 0) {
      return c.notFound();
    }

    return c.json(
      results
        .flatMap((result) => result.snapshotData)
        .map<
          z.infer<
            (typeof ApiEndpoint.GetExchangeRatesCurrencyHistorical)["outputSchema"]
          >[0]
        >((data) => ({
          ...data,
          dataStaleness: data.dataStaleness.toISOString(),
          liquidity: data.liquidity.toString(),
        })),
    );
  },
);

ApiEndpoint.GetExchangeRatesCurrencyList satisfies {
  path: "prices/exchange-rates/:realm/:leagueId/currency";
  method: "GET";
};
prices.get(
  "/exchange-rates/:realm/:leagueId/currency",
  valkeyCache({
    ttl() {
      const livesUntil = new Date();
      livesUntil.setMinutes(0, 0, 0);
      livesUntil.setHours(livesUntil.getHours() + 1);
      return Math.floor((livesUntil.getTime() - Date.now()) / 1000);
    },
    keyPrefix: "exchange-rates:currency-list",
  }),
  async (c) => {
    const { realm, leagueId } = c.req.param();

    const db = c.get("db");

    const results = await db
      .selectDistinctOn([CurrencyExchangeLeagueSnapshotData.currency], {
        currency: CurrencyExchangeLeagueSnapshotData.currency,
        value: CurrencyExchangeLeagueSnapshotData.valuedAt,
        stableCurrency: CurrencyExchangeLeagueSnapshotData.stableCurrency,
        confidenceScore: CurrencyExchangeLeagueSnapshotData.confidenceScore,
        timestamp: CurrencyExchangeHistory.timestamp,
      })
      .from(CurrencyExchangeLeagueSnapshotData)
      .innerJoin(
        CurrencyExchangeHistory,
        eq(
          CurrencyExchangeLeagueSnapshotData.historyId,
          CurrencyExchangeHistory.id,
        ),
      )
      .where(() =>
        and(
          eq(CurrencyExchangeHistory.realm, realm),
          eq(CurrencyExchangeHistory.leagueId, leagueId),
        ),
      )
      .orderBy(
        CurrencyExchangeLeagueSnapshotData.currency,
        desc(CurrencyExchangeHistory.timestamp),
      );

    if (results.length === 0) {
      return c.notFound();
    }

    return c.json(
      results.map<
        z.infer<
          (typeof ApiEndpoint.GetExchangeRatesCurrencyList)["outputSchema"]
        >[0]
      >((data) => ({
        currency: data.currency,
        confidenceScore: data.confidenceScore,
        value: {
          currency: data.stableCurrency,
          amount: data.value,
        },
      })),
    );
  },
);

ApiEndpoint.GetStaticTradeData satisfies {
  path: "prices/static-trade-data";
  method: "GET";
};
prices.get(
  "/static-trade-data",
  valkeyCache({
    ttl: 60 * 10,
    keyPrefix: "static-trade-data",
  }),
  async (c) => {
    const snapshotRaw = await c
      .get("valkey")
      .get<string>(StaticTradeDataSnapshotRedisKey);

    if (!snapshotRaw) {
      return c.notFound();
    }

    const snapshot = StaticTradeDataSnapshotDto.parse(
      typeof snapshotRaw === "string" ? JSON.parse(snapshotRaw) : snapshotRaw,
    ) satisfies z.infer<
      (typeof ApiEndpoint.GetStaticTradeData)["outputSchema"]
    >;

    return c.json(snapshot);
  },
);
