import type { Hyperdrive, R2Bucket } from "@cloudflare/workers-types";
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
  BUCKET: R2Bucket;

  S3_ENDPOINT: string;
  S3_BUCKET_NAME: string;
  S3_ACCESS_KEY_ID: string;
  S3_SECRET_ACCESS_KEY: string;
};

type AppEnv = { Bindings: AppBindings };

export type AppContext = Context<AppEnv>;
