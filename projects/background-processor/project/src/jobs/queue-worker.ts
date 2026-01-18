import { Worker, Job } from "bullmq";
import { JobProcess } from "../job-process.interface.js";
import { createValkeyConnection } from "../valkey.js";
import { z } from "zod";

export abstract class QueueWorker<T extends z.ZodType> implements JobProcess {
  protected abstract readonly schema: T;
  protected abstract readonly queueName: string;

  private worker!: Worker;

  public abstract processJob(data: z.infer<T>): Promise<void>;

  public async start(): Promise<void> {
    this.worker = new Worker(
      this.queueName,
      async (job: Job) => {
        const parsed = this.schema.safeParse(job.data);
        if (!parsed.success) {
          throw new Error(
            `Invalid job data for job ${job.id}: ${parsed.error.message}`,
          );
        }
        await this.processJob(parsed.data);
      },
      {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
        connection: createValkeyConnection() as any,
      },
    );

    this.worker.on("failed", (job, err) => {
      if (job) {
        console.error(`Job ${job.id} failed with ${err.message}`);
      }
    });

    // Keep this function alive
    await new Promise<void>((resolve, reject) => {
      this.worker.on("closed", () => {
        console.log("Worker closed");
        resolve();
      });
      this.worker.on("error", (err) => {
        console.error("Worker error:", err);
        reject(err);
      });
    });
  }

  public async stop(): Promise<void> {
    await this.worker.close();
  }
}
