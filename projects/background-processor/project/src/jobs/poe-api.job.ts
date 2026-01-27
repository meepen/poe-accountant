import { Job, DelayedError } from "bullmq";
import { z } from "zod";
import { QueueWorker } from "./queue-worker.abstract.js";
import { PoeRateLimiter } from "./poe-api/rate-limiter.js";
import {
  PoeApiJobSchema,
  PoeApiJobReturnSchema,
  PoeApiJobName,
} from "../schemas/poe-api.schema.js";

export class PoeApiJob extends QueueWorker<
  typeof PoeApiJobSchema,
  typeof PoeApiJobReturnSchema
> {
  protected override readonly queueName = PoeApiJobName;
  protected override readonly schema = PoeApiJobSchema;
  protected override readonly returnSchema = PoeApiJobReturnSchema;
  protected override readonly concurrency = 5;

  private readonly limiter = new PoeRateLimiter(this.connection);

  protected override async processJob(
    data: z.infer<typeof PoeApiJobSchema>,
    job: Job,
  ): Promise<z.infer<typeof PoeApiJobReturnSchema>> {
    // 1. IDENTITY
    // Use job.id if available for traceability, otherwise generate a unique ID.
    // This ID is used to 'sign' the reservation in Redis.
    const uniqueId = job.id || crypto.randomUUID();
    console.debug(
      `[${uniqueId}] Processing POE API Job: ${data.endpointName} for account ${data.accountId}`,
    );

    // 2. ATOMIC CHECK
    // We pass uniqueId so we can find and remove this specific hit if the request fails later.
    const delayRequired = await this.limiter.reserveSlot(
      data.endpointName,
      data.accountId,
      uniqueId,
    );

    console.debug(
      `[${uniqueId}] Rate limit check complete, delay required: ${delayRequired}ms`,
    );

    if (delayRequired > 0) {
      console.log(`Rate limit hit! Backing off for ${delayRequired}ms`);
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

      // 4. SYNCHRONIZATION
      // Update rules immediately to reconcile server state
      // Note: We swallow errors here to avoid 'Double Spend' (failing a successful job).
      try {
        await this.limiter.updateRules(
          data.endpointName,
          data.accountId,
          response.headers,
        );
      } catch (syncError) {
        console.warn(
          "Failed to sync rate limits after successful API call",
          syncError,
        );
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

      const responseText = await response.text();
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
            data.accountId,
            uniqueId,
          );
        } catch (rollbackError) {
          console.error("Failed to execute rollback", rollbackError);
        }
      }
      throw error;
    }
  }
}
