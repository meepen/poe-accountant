import { z } from "zod";
import { QueueWorker } from "./queue-worker.abstract.js";
import { Queue, WorkerOptions } from "bullmq";
import { valkeyForBullMQ } from "../connections/valkey.js";

export abstract class QueueScheduler<
  T extends z.ZodType,
> extends QueueWorker<T> {
  protected abstract readonly queueName: string;
  protected abstract readonly queueData: z.infer<T>;
  protected readonly returnSchema = z.void();
  protected abstract readonly cron: string;

  protected jobScheduler!: Queue;

  protected override get workerOptions(): WorkerOptions {
    return {
      ...super.workerOptions,
      removeOnFail: {
        count: 0,
      },
      removeOnComplete: {
        count: 0,
      },
    };
  }

  public override async start(): Promise<void> {
    this.jobScheduler = new Queue(this.queueName, {
      connection: valkeyForBullMQ,
    });

    await this.jobScheduler.upsertJobScheduler(
      this.queueName,
      {
        pattern: this.cron,
      },
      {
        data: this.queueData,
        name: this.queueName,
        opts: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 60000,
          },
          removeOnComplete: true,
          removeOnFail: true,
        },
      },
    );

    await super.start();
  }

  public override async stop() {
    await super.stop();
  }
}
