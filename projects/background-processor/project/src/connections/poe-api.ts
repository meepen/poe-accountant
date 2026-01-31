import { PoeApi, type ServerApi } from "@meepen/poe-common/api";
import { getEnvVar } from "../utils.js";
import { Queue, QueueEvents } from "bullmq";
import {
  PoeApiJobName,
  PoeApiJobReturnSchema,
  PoeApiJobSchema,
} from "../schemas/poe-api.schema.js";
import { z } from "zod";
import { valkeyForBullMQ } from "./valkey.js";

class ApplicationPoeApi extends PoeApi {
  protected readonly queue = new Queue<
    z.infer<typeof PoeApiJobSchema>,
    z.infer<typeof PoeApiJobReturnSchema>
  >(PoeApiJobName, {
    connection: valkeyForBullMQ,
  });
  private readonly queueEvents = new QueueEvents(PoeApiJobName, {
    connection: valkeyForBullMQ,
  });
  protected authScopes = new Map<string, Promise<string>>();
  protected authTokenMap = new Map<string, string>();

  protected override userAgent = `OAuth ${getEnvVar("PATHOFEXILE_CLIENT_ID")}/${getEnvVar("PATHOFEXILE_APP_VERSION")} (contact: ${getEnvVar("PATHOFEXILE_CONTACT_EMAIL")}) background-processor/ApplicationPoeApi`;

  protected override authenticate(endpointData: ServerApi): Promise<string> {
    const authPromise = this.authScopes.get(endpointData.requiredScope);
    if (authPromise) {
      return authPromise;
    }

    const newAuthPromise = fetch("https://www.pathofexile.com/oauth/token", {
      method: "POST",
      headers: {
        "User-Agent": this.userAgent,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: getEnvVar("PATHOFEXILE_CLIENT_ID"),
        client_secret: getEnvVar("PATHOFEXILE_CLIENT_SECRET"),
        scope: endpointData.requiredScope,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Authentication failed with status ${response.status}: ${response.statusText}`,
          );
        }
        return response.json() as Promise<{
          access_token: string;
          sub: string;
        }>;
      })
      .then((data) => {
        this.authTokenMap.set(data.access_token, data.sub);
        return data.sub;
      })
      .catch((err: unknown) => {
        this.authScopes.delete(endpointData.requiredScope);
        throw err;
      });

    this.authScopes.set(endpointData.requiredScope, newAuthPromise);

    return newAuthPromise;
  }

  protected override voidAuthentication(endpointData: ServerApi): void {
    this.authScopes.delete(endpointData.requiredScope);
  }

  protected override async fetch(
    endpointData: ServerApi,
    endpoint: URL,
    options: RequestInit & { body: string | undefined },
  ): Promise<Response> {
    const headers = new Headers(options.headers || {});

    const accessToken = headers.get("Authorization")?.startsWith("Bearer ")
      ? this.authTokenMap.get(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          headers.get("Authorization")!.substring("Bearer ".length),
        )
      : null;
    const sub = accessToken ? this.authTokenMap.get(accessToken) : null;

    const job = await this.queue.add(crypto.randomUUID(), {
      ruleDetails: {
        client: getEnvVar("PATHOFEXILE_CLIENT_ID"),
        ...(sub ? { account: sub } : {}),
      },
      endpointName: endpointData.name,
      request: {
        url: endpoint.toString(),
        method: options.method || "GET",
        headers: Object.fromEntries(headers.entries()),
        body: options.body,
      },
    });

    const result = await job.waitUntilFinished(this.queueEvents);

    return new Response(result.result, {
      status: result.status,
    });
  }
}

export const appApi = new ApplicationPoeApi();
export const realms = ["pc"] as const;
