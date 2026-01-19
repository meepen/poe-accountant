import {
  ApiEndpoint,
  ApiEndpointMethods,
} from "@meepen/poe-accountant-api-schema/api/api-endpoints.enum";
import { Hono } from "hono";
import { AppEnv } from "../bindings";
import { getSessionUser } from "../db/user";
import { getValkey } from "../valkey";

export const user = new Hono<AppEnv>();

ApiEndpoint.GetUser satisfies "user";
ApiEndpointMethods[ApiEndpoint.GetUser] satisfies "GET";
user.get("/", async (c) => {
  const user = await getSessionUser(getValkey(c.env), c);

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json(user);
});
