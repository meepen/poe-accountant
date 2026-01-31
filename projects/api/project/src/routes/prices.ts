import { Hono } from "hono";
import { AppEnv } from "../bindings";
import { valkeyCache } from "../utils/cache";
import { getDb } from "../db";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

export const prices = new Hono<AppEnv>();

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

    const db = getDb(c.env);

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

prices.get(
  "/exchange-rates/:realm/:leagueId/currency/:currency/historical",
  async (c) => {
    // for now get the last 5 days of data and return it
    const { realm, leagueId, currency } = c.req.param();

    const db = getDb(c.env);

    // TODO:
  },
);
