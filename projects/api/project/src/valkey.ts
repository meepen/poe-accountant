import { Redis, RedisConfigNodejs } from "@upstash/redis";
import { AppBindings } from "./bindings";

export function getValkey(env: AppBindings) {
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
