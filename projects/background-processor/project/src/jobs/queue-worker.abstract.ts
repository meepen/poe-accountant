import { Worker, Job, WorkerOptions } from "bullmq";
import { JobProcess } from "../job-process.interface.js";
import { createValkeyConnection } from "../connections/valkey.js";
import { z } from "zod";

type MaybePromise<T> = T | Promise<T>;

export abstract class QueueWorker<
  T extends z.ZodType,
  ReturnType extends z.ZodType = z.ZodVoid,
> implements JobProcess {
  protected abstract readonly schema: T;
  protected abstract readonly returnSchema: ReturnType;
  protected abstract readonly queueName: string;
  protected readonly concurrency = 5;

  protected readonly connection = createValkeyConnection();

  protected worker?: Worker<z.infer<T>, z.infer<ReturnType>>;

  protected get workerOptions(): WorkerOptions {
    return {
      connection: this.connection.valkeyForBullMQ,
      concurrency: this.concurrency,
    };
  }

  protected setReturnValue(job: Job, data: z.infer<ReturnType>): void {
    job.returnvalue = this.returnSchema.parse(data);
  }

  protected abstract processJob(
    data: z.infer<T>,
    job: Job,
  ): MaybePromise<z.infer<ReturnType>>;

  public start(): void | Promise<void> {
    this.worker = new Worker<z.infer<T>, z.infer<ReturnType>>(
      this.queueName,
      async (job: Job) => {
        return await this.processJob(this.schema.parse(job.data), job);
      },
      this.workerOptions,
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
