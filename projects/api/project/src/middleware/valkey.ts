import type { RedisConfigNodejs } from "@upstash/redis";
import { Redis } from "@upstash/redis";
import type { AppBindings, AppEnv } from "../bindings";
import { createMiddleware } from "hono/factory";

function getValkey(env: AppBindings) {
  return new Redis({
    url: env.VALKEY_PROXY_URL,
    token: env.VALKEY_TOKEN,
    fetch: (
      input: RequestInfo | URL,
      init: RequestInit<RequestInitCfProperties> | undefined,
    ) => {
      delete init?.cache;
      return fetch(input, init);
    },
  } as RedisConfigNodejs);
}

export const valkeyMiddleware = createMiddleware<AppEnv & ValkeyEnv>(
  async (c, next) => {
    if (!c.get("valkey") as unknown) {
      c.set("valkey", getValkey(c.env));
    }

    await next();
  },
);

export type Valkey = ReturnType<typeof getValkey>;
export type ValkeyEnv = {
  Variables: {
    valkey: Valkey;
  };
};
