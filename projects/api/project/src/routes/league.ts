import { Hono } from "hono";
import { AppEnv } from "../bindings";
import { getDb } from "../db";
import {
  ApiEndpoint,
  ApiEndpointMethods,
} from "@meepen/poe-accountant-api-schema/api/api-endpoints.enum";
import { ApiResponse } from "@meepen/poe-accountant-api-schema/api/api-request-data.dto";

export const league = new Hono<AppEnv>();

ApiEndpoint.GetLeagues satisfies "league";
ApiEndpointMethods[ApiEndpoint.GetLeagues] satisfies "GET";

league.get("", async (c) => {
  const db = getDb(c.env);

  const leagues = await db.query.League.findMany({
    where: (league, { isNotNull, and, gte, lte, or }) =>
      and(
        isNotNull(league.startDate),
        lte(league.startDate, new Date()),
        or(isNotNull(league.endDate), gte(league.endDate, new Date())),
      ),
    orderBy: (league, { desc }) => [desc(league.startDate)],
  });

  return c.json(
    leagues.map<ApiResponse<ApiEndpoint.GetLeagues>[0]>((league) => ({
      id: league.id,
      leagueName: league.leagueName,
      leagueId: league.leagueId,
      realm: league.realm,
      startDate: league.startDate?.toISOString() ?? null,
      endDate: league.endDate?.toISOString() ?? null,
    })),
  );
});
