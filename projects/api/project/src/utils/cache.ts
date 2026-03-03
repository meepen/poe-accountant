import { createMiddleware } from "hono/factory";
import { z } from "zod";
import type { ValkeyEnv } from "../middleware/valkey";
import type { AppEnv } from "../bindings";
import type { StatusCode } from "hono/utils/http-status";

type CacheOptions = {
  ttl: number | (() => number);
  keyPrefix: string;
};

const cacheObject = z.object({
  body: z.string(),
  headers: z.record(z.string(), z.string()),
  status: z.number(),
});

export const valkeyCache = (options: CacheOptions) => {
  const { ttl, keyPrefix } = options;

  return createMiddleware<AppEnv & ValkeyEnv>(async (c, next) => {
    if (c.req.method !== "GET") {
      // Only cache GET requests
      await next();
      return;
    }

    const client = c.get("valkey");

    const key = `${keyPrefix}:${c.req.path}`;

    // 1. Try to fetch from Cache
    const cached = await client.get<z.infer<typeof cacheObject>>(key);

    if (cached) {
      try {
        // Handle case where Upstash might have already parsed the JSON
        const { body, headers, status } = cacheObject.parse(cached);

        // Convert the base64 body back to a buffer
        const bodyBuffer = Buffer.from(body, "base64");

        // Return the cached response
        return c.newResponse(bodyBuffer, status as StatusCode, headers);
      } catch (e) {
        // If parsing fails, delete corrupt key and proceed
        console.error("Cache parse error", e);
        await client.del(key);
      }
    }

    // 2. If Miss, execute the handler
    await next();

    // 3. Cache the response (only successful GET requests)
    if (c.res.status >= 200 && c.res.status < 300) {
      const arrayBuffer = await c.res.clone().arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const cacheData: z.infer<typeof cacheObject> = {
        body: buffer.toString("base64"),
        headers: {
          "Content-Type":
            c.res.headers.get("Content-Type") || "text/plain;charset=UTF-8",
        },
        status: c.res.status,
      };

      const realTtl = typeof ttl === "function" ? ttl() : ttl;

      await client.set(key, cacheData, {
        ex: realTtl,
      });

      // Also notify the client that this response is cached for however long
      c.res.headers.set(
        "Cache-Control",
        `public, max-age=${realTtl}, immutable`,
      );
    }
  });
};
