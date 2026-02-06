import { LeagueCollectorJob } from "./jobs/league-collector.job.js";
import { MailboxProcess } from "./jobs/mailbox.js";
import { MinuteJob } from "./jobs/minute.job.js";
import { PoeApiJob } from "./jobs/poe-api.job.js";
import { UpdateCurrencyDataJob } from "./jobs/update-currency-data.job.js";
import { UpdateCurrencySnapshotsJob } from "./jobs/update-currency-snapshots.job.js";

const processors = [
  new MailboxProcess(),
  new MinuteJob(),
  new PoeApiJob(),
  new LeagueCollectorJob(),
  new UpdateCurrencyDataJob(),
  new UpdateCurrencySnapshotsJob(),
];

async function main() {
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
