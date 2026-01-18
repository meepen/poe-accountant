import { type Hyperdrive } from "@cloudflare/workers-types";

type AppBindings = {
  CORS_ORIGIN: string;
  VALKEY_URL: string;
  VALKEY_TOKEN: string;
  HYPERDRIVE: Hyperdrive;
};
