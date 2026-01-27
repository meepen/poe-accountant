import z from "zod";
import { QueueScheduler } from "./queue-scheduler.abstract.js";

const MinuteJobQueueName = "minute-job-queue";
const MinuteJobQueueSchema = z.object({});

export class MinuteJob extends QueueScheduler<typeof MinuteJobQueueSchema> {
  protected override readonly returnSchema = z.void();
  protected override readonly queueName = MinuteJobQueueName;
  protected override readonly schema = MinuteJobQueueSchema;
  protected override readonly queueData = {};

  protected override readonly cron = "* * * * *";

  public override processJob() {
    // Implement the logic that needs to run every minute here
    console.log("Minute job executed at", new Date().toISOString());
  }
}
