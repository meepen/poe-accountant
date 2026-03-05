import type { Hyperdrive } from "@cloudflare/workers-types";
import type { Context } from "hono";

export type AppBindings = {
  PATHOFEXILE_CLIENT_ID: string;
  PATHOFEXILE_CLIENT_SECRET: string;
  PATHOFEXILE_REDIRECT_URL: string;

  FRONTEND_URL: string;

  CORS_ORIGIN: string;
  VALKEY_PROXY_URL: string;
  VALKEY_TOKEN: string;
  HYPERDRIVE: Hyperdrive;

  ASSETS_S3_ENDPOINT: string;
  ASSETS_S3_BUCKET_NAME: string;
  ASSETS_S3_ACCESS_KEY_ID: string;
  ASSETS_S3_SECRET_ACCESS_KEY: string;
};

export type AppEnv = {
  Bindings: AppBindings;
};

export type AppContext = Context<AppEnv>;
