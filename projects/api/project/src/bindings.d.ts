import { type Hyperdrive } from "@cloudflare/workers-types";

type AppBindings = {
  VALKEY_URL: string;
  VALKEY_TOKEN: string;
  HYPERDRIVE: Hyperdrive;
};
