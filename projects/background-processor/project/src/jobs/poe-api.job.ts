import { Job, DelayedError } from "bullmq";
import { z } from "zod";
import { QueueWorker } from "./queue-worker.abstract.js";
import { PoeRateLimiter } from "./poe-api/rate-limiter.js";
import {
  PoeApiJobSchema,
  PoeApiJobReturnSchema,
  PoeApiJobName,
  PoeApiJobSpecialCase,
} from "../schemas/poe-api.schema.js";
import { serverApiPaths } from "@meepen/poe-common";

async function getPublicIp(): Promise<string> {
  const response = await fetch("https://checkip.amazonaws.com");
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const ip = (await response.text()).trim();
  if (!ip) {
    throw new Error("Empty IP response");
  }
  return ip;
}

export class PoeApiJob extends QueueWorker<
  typeof PoeApiJobSchema,
  typeof PoeApiJobReturnSchema
> {
  protected override readonly queueName = PoeApiJobName;
  protected override readonly schema = PoeApiJobSchema;
  protected override readonly returnSchema = PoeApiJobReturnSchema;
  protected override readonly concurrency = 5;

  private readonly limiter = new PoeRateLimiter({
    hitCountBuffer: 2,
    hitTimingBuffer: 2500,
  });

  protected async getRuleDetails(
    ruleDetails: Record<string, string>,
  ): Promise<Record<string, string>> {
    return {
      ...ruleDetails,
      ip: await this.getClientIp(),
    };
  }

  private clientIp: string | null = null;
  private ipPromise: Promise<string> | null = null;

  private getClientIp(): Promise<string> | string {
    if (this.clientIp) {
      return this.clientIp;
    }
    if (!this.ipPromise) {
      this.ipPromise = getPublicIp()
        .then((ip) => {
          this.clientIp = ip;
          return ip;
        })
        .catch((err: unknown) => {
          this.ipPromise = null;
          throw err;
        });
    }
    return this.ipPromise;
  }

  protected override async processJob(
    data: z.infer<typeof PoeApiJobSchema>,
    job: Job,
  ): Promise<z.infer<typeof PoeApiJobReturnSchema>> {
    // 1. IDENTITY
    // Use job.id if available for traceability, otherwise generate a unique ID.
    // This ID is used to 'sign' the reservation in Redis.
    const uniqueId = job.id || crypto.randomUUID();
    console.debug(`[${uniqueId}] Processing POE API Job: ${data.endpointName}`);

    // 2. ATOMIC CHECK
    // We pass uniqueId so we can find and remove this specific hit if the request fails later.
    const delayRequired = await this.limiter.reserveSlot(
      data.endpointName,
      await this.getRuleDetails(data.ruleDetails),
      uniqueId,
    );

    console.debug(
      `[${uniqueId}] Rate limit check complete, delay required: ${delayRequired}ms`,
    );

    if (delayRequired > 0) {
      await job.moveToDelayed(Date.now() + delayRequired, job.token);
      throw new DelayedError();
    }

    try {
      // 3. API EXECUTION
      console.debug(
        `[${uniqueId}] Executing API request to ${data.request.url}`,
      );
      const response = await fetch(data.request.url, {
        method: data.request.method,
        headers: data.request.headers,
        body: data.request.body,
      });

      console.debug(
        `[${uniqueId}] Received response with status ${response.status}`,
      );

      const responseText = await response.text();
      let updateRules = true;

      if (data.specialCase === PoeApiJobSpecialCase.ExchangeRateRules) {
        // Check if url.endsWith(response.data.next_change_id), if so they have bucketed rules.
        const exchangeData = serverApiPaths[
          "Get Exchange Markets"
        ].responseType.parse(JSON.parse(responseText));
        if (data.request.url.endsWith(String(exchangeData.next_change_id))) {
          console.debug(
            `[${uniqueId}] Detected bucketed exchange rate rules, updating limiter state`,
          );
          // Assuming we don't call this too often...
          updateRules = false;
        }
      }

      // 4. SYNCHRONIZATION
      // Update rules immediately to reconcile server state
      // Note: We swallow errors here to avoid 'Double Spend' (failing a successful job).
      if (updateRules) {
        try {
          await this.limiter.updateRules(
            data.endpointName,
            await this.getRuleDetails(data.ruleDetails),
            response.headers,
          );
        } catch (syncError) {
          console.warn(
            "Failed to sync rate limits after successful API call",
            syncError,
          );
        }
      }

      // 5. FAILSAFE (429)
      if (response.status === 429) {
        const retryHeader = response.headers.get("retry-after") || "5";
        let retryAfterSeconds = parseInt(retryHeader, 10);
        if (isNaN(retryAfterSeconds)) {
          retryAfterSeconds = 5;
        }

        // JITTER: Add 0-1000ms random delay to prevent 'Thundering Herd'
        // where all retrying jobs wake up at the exact same millisecond.
        const jitter = Math.floor(Math.random() * 1000);
        const delayMs = retryAfterSeconds * 1000 + jitter;

        console.warn(
          `Safety Net: 429 received. Waiting ${retryAfterSeconds}s (+${jitter}ms jitter)`,
        );

        await job.moveToDelayed(Date.now() + delayMs, job.token);
        throw new DelayedError();
      }

      console.debug(`[${uniqueId}] API request completed successfully`);

      return {
        status: response.status,
        result: responseText,
      };
    } catch (error) {
      // 6. ROLLBACK (Failure Path)
      // If the error is NOT a DelayedError (meaning it's a network crash, timeout, etc),
      // we must remove the hit from Redis so we don't pay for a request that never happened.
      if (!(error instanceof DelayedError)) {
        console.warn(
          `Job failed with network/system error, rolling back capacity for ${uniqueId}`,
        );
        try {
          await this.limiter.rollbackSlot(
            data.endpointName,
            await this.getRuleDetails(data.ruleDetails),
          );
        } catch (rollbackError) {
          console.error("Failed to execute rollback", rollbackError);
        }
      }
      throw error;
    }
  }
}
