import type { AppBindings } from "./bindings";

export function fetchWrapper(
  env: AppBindings,
  input: RequestInfo,
  init?: RequestInit,
) {
  const userAgent = `OAuth ${env.PATHOFEXILE_CLIENT_ID}/0.0.0 (contact: meep@meepen.dev) api`;
  if (!init) {
    init = {};
  }
  if (!init.headers) {
    init.headers = {};
  }

  if (Array.isArray(init.headers)) {
    init.headers.push(["User-Agent", userAgent]);
  } else if (init.headers instanceof Headers) {
    init.headers.set("User-Agent", userAgent);
  } else {
    init.headers["User-Agent"] = userAgent;
  }

  return fetch(input, init);
}
