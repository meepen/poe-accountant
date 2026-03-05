import { Queue } from "bullmq";
import {
  MailboxQueue,
  MailboxQueueName,
} from "@meepen/poe-accountant-api-schema/queues/mailbox-queue";
import type { JobProcess } from "../job-process.interface.js";
import { valkey, valkeyForBullMQ } from "../connections/valkey.js";

export class MailboxProcess implements JobProcess {
  private isRunning: boolean = true;

  private readonly queueMap = new Map<string, Queue>();

  private getJobQueue(name: string): Queue {
    if (!this.queueMap.has(name)) {
      const queue = new Queue(name, {
        connection: valkeyForBullMQ,
        streams: {
          events: {
            maxLen: 50,
          },
        },
      });
      this.queueMap.set(name, queue);
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.queueMap.get(name)!;
  }

  private async processMessage(incomingMessage: string) {
    const {
      messageId,
      data: { targetQueue, message },
      priority,
    } = MailboxQueue.parse(JSON.parse(incomingMessage));

    await this.getJobQueue(targetQueue).add(messageId, message, {
      priority,
    });
    console.log(
      `Resubmitted job '${targetQueue}' to BullMQ queue' (${messageId}).`,
    );
  }

  protected async worker() {
    while (this.isRunning) {
      try {
        // blpop returns [key, element] or null if timeout
        // 0 means block indefinitely
        const result = await valkey.blpop(MailboxQueueName, 1); // Using 1s timeout to allow check for shutdown signals

        if (result) {
          const [, message] = result;
          await this.processMessage(message);
        }
      } catch (error: unknown) {
        if (
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          !this.isRunning &&
          error instanceof Error &&
          error.message === "Connection is closed."
        ) {
          // Expected during shutdown
          break;
        }
        console.error("Error in mailbox loop:", error);
        // Wait a bit before retrying to avoid tight loop on persistent errors
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  protected job!: Promise<void>;

  public start() {
    this.job = new Promise((resolve, reject) => {
      this.worker().then(resolve).catch(reject);
    });
  }
  public async stop(): Promise<void> {
    this.isRunning = false;
    await Promise.all(
      Array.from(this.queueMap.values()).map((queue) => queue.close()),
    );
  }
}
