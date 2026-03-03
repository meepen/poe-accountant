import { PoeApi, type ServerApi } from "@meepen/poe-common/api";
import { Queue, QueueEvents } from "bullmq";
import type {
  PoeApiJobReturnSchema,
  PoeApiJobSchema,
} from "../schemas/poe-api.schema.js";
import {
  PoeApiJobName,
  PoeApiJobSpecialCase,
} from "../schemas/poe-api.schema.js";
import type { z } from "zod";
import { valkeyForBullMQ } from "./valkey.js";
import { serverApiPaths } from "@meepen/poe-common";
import { getEnvVar } from "../utils.js";

export abstract class BasePoeApi extends PoeApi {
  protected readonly queue = new Queue<
    z.infer<typeof PoeApiJobSchema>,
    z.infer<typeof PoeApiJobReturnSchema>
  >(PoeApiJobName, {
    connection: valkeyForBullMQ,
  });

  private readonly queueEvents = new QueueEvents(PoeApiJobName, {
    connection: valkeyForBullMQ,
  });

  protected readonly authTokenMap = new Map<string, string>();

  protected getBaseUserAgent(suffix: string): string {
    return `OAuth ${getEnvVar("PATHOFEXILE_CLIENT_ID")}/${getEnvVar("PATHOFEXILE_APP_VERSION")} (contact: ${getEnvVar("PATHOFEXILE_CONTACT_EMAIL")}) ${suffix}`;
  }

  protected getSpecialCase(
    endpointData: ServerApi,
    _endpoint: URL,
    _options: RequestInit & { body: string | undefined },
  ): PoeApiJobSpecialCase {
    switch (endpointData.name) {
      case serverApiPaths["Get Exchange Markets"].name:
        return PoeApiJobSpecialCase.ExchangeRateRules;
      default:
        break;
    }

    return PoeApiJobSpecialCase.None;
  }

  protected abstract getRequestAccountSub(
    _endpointData: ServerApi,
    headers: Headers,
  ): string | undefined;

  protected override async fetch(
    endpointData: ServerApi,
    endpoint: URL,
    options: RequestInit & { body: string | undefined },
  ): Promise<Response> {
    const headers = new Headers(options.headers);
    const accountSub = this.getRequestAccountSub(endpointData, headers);

    const job = await this.queue.add(crypto.randomUUID(), {
      ruleDetails: {
        client: getEnvVar("PATHOFEXILE_CLIENT_ID"),
        ...(accountSub ? { account: accountSub } : {}),
      },
      endpointName: endpointData.name,
      request: {
        url: endpoint.toString(),
        method: options.method ?? "GET",
        headers: Object.fromEntries(headers.entries()),
        body: options.body,
      },
      specialCase: this.getSpecialCase(endpointData, endpoint, options),
    });

    const result = await job.waitUntilFinished(this.queueEvents);

    return new Response(result.result, {
      status: result.status,
    });
  }
}
