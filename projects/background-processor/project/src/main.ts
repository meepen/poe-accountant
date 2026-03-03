import type { JobProcess } from "./job-process.interface.js";
import { LeagueCollectorJob } from "./jobs/league-collector.job.js";
import { MailboxProcess } from "./jobs/mailbox.js";
import { PoeApiJob } from "./jobs/poe-api.job.js";
import { StaticTradeDataJob } from "./jobs/static-trade-data.job.js";
import { SyncUserLeaguesJob } from "./jobs/sync-user-inventory.job.js";
import { UpdateCurrencyDataJob } from "./jobs/update-currency-data.job.js";
import { UpdateCurrencySnapshotsJob } from "./jobs/update-currency-snapshots.job.js";

const staticTradeDataJob = new StaticTradeDataJob();
const processors: JobProcess[] = [
  new MailboxProcess(),
  new PoeApiJob(),
  new SyncUserLeaguesJob(),
  new LeagueCollectorJob(),
  new UpdateCurrencyDataJob(),
  new UpdateCurrencySnapshotsJob(),
  staticTradeDataJob,
];

async function main() {
  console.log("Static data starting to load...");
  await staticTradeDataJob.processNow();
  console.log("Starting background processor...");

  await Promise.all(
    processors.map((processor) => Promise.resolve(processor.start())),
  );
}

let isShuttingDown = false;
function shutdown() {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  console.log("Shutting down...");

  Promise.allSettled(
    processors.map((processor) => Promise.resolve(processor.stop())),
  )
    .then(() => {
      console.log("Shutdown complete.");
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error("Error during shutdown:", error);
      process.exit(1);
    });
}

process.on("SIGINT", shutdown);

main()
  .then(() =>
    Promise.all([
      LeagueCollectorJob.processNow(),
      UpdateCurrencyDataJob.processNow(),
      UpdateCurrencySnapshotsJob.processNow(),
    ]),
  )
  .catch((error: unknown) => {
    console.error("Unhandled error in main:", error);
    process.exit(1);
  });
