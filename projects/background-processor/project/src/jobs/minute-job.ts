import z from "zod";
import { QueueScheduler } from "./queue-scheduler.abstract.js";

const MinuteJobQueueName = "minute-job-queue";
const MinuteJobQueueSchema = z.object({});

export class MinuteJob extends QueueScheduler<typeof MinuteJobQueueSchema> {
  protected readonly queueName = MinuteJobQueueName;
  protected readonly schema = MinuteJobQueueSchema;
  protected readonly queueData = {};

  public processJob(_data: z.infer<typeof MinuteJobQueueSchema>) {
    // Implement the logic that needs to run every minute here
    console.log("Minute job executed at", new Date().toISOString());
  }
}
