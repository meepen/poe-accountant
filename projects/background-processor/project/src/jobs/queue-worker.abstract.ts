import { Worker, Job } from "bullmq";
import { JobProcess } from "../job-process.interface.js";
import { createValkeyConnection } from "../valkey.js";
import { z } from "zod";

export abstract class QueueWorker<T extends z.ZodType> implements JobProcess {
  protected abstract readonly schema: T;
  protected abstract readonly queueName: string;
  protected readonly concurrency = 5;

  protected readonly connection = createValkeyConnection();

  protected worker?: Worker;

  public abstract processJob(data: z.infer<T>): Promise<void> | void;

  public start(): void | Promise<void> {
    this.worker = new Worker(
      this.queueName,
      async (job: Job) => {
        await this.processJob(this.schema.parse(job.data));
      },
      {
        connection: this.connection.valkeyForBullMQ,
        concurrency: this.concurrency,
      },
    );

    this.worker.on("failed", (job, err) => {
      if (job) {
        console.error(`Job ${job.id} failed with ${err.message}`);
      }
    });

    this.worker.on("error", (err) => {
      console.error("Worker error:", err);
    });

    this.worker.on("ready", () => {
      console.log(`Worker for queue '${this.queueName}' is ready.`);
    });

    this.worker.on("failed", (job, err) => {
      console.error(
        `Job ${job?.id ?? "unknown"} in queue '${this.queueName}' failed with error: ${err.message}`,
      );
    });
  }

  public async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
