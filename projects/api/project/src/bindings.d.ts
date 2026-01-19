import type { Hyperdrive } from "@cloudflare/workers-types";
import type { Context } from "hono";

type AppBindings = {
  PATHOFEXILE_CLIENT_ID: string;
  PATHOFEXILE_CLIENT_SECRET: string;
  PATHOFEXILE_REDIRECT_URL: string;

  FRONTEND_URL: string;

  CORS_ORIGIN: string;
  VALKEY_URL: string;
  VALKEY_TOKEN: string;
  HYPERDRIVE: Hyperdrive;
};

type AppEnv = { Bindings: AppBindings };

export type AppContext = Context<AppEnv>;
