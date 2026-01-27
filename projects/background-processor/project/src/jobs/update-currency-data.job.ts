import { Job } from "bullmq";
import { QueueScheduler } from "./queue-scheduler.abstract.js";
import { z } from "zod";
import { appApi } from "../poe-api.js";

const UpdateCurrencyDataJobQueueName = "update-currency-data-job-queue";
const UpdateCurrencyDataJobSchema = z.object({});

export class UpdateCurrencyDataJob extends QueueScheduler<
  typeof UpdateCurrencyDataJobSchema
> {
  protected override readonly returnSchema = z.void();
  protected override readonly queueName = UpdateCurrencyDataJobQueueName;
  protected override readonly schema = UpdateCurrencyDataJobSchema;
  protected override readonly queueData = {};

  protected override readonly cron = "* * * * *";

  public override async processJob(
    _data: z.infer<typeof UpdateCurrencyDataJobSchema>,
    _job: Job<z.infer<typeof UpdateCurrencyDataJobSchema>>,
  ): Promise<void> {
    const leagueList = await appApi.getLeagues();
    console.debug(
      `Fetched ${leagueList.leagues.length} leagues for currency data update.`,
    );

    for (const league of leagueList.leagues) {
      console.debug("realm id", league.realm, league.id);
    }
  }
}
