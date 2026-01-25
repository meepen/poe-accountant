import { MailboxProcess } from "./jobs/mailbox.js";
import { MinuteJob } from "./jobs/minute-job.js";

const processors = [new MailboxProcess(), new MinuteJob()];

async function main() {
  console.log("Starting background processor...");

  await Promise.all(
    processors.map((processor) => Promise.resolve(processor.start())),
  );
}

function shutdown() {
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

main().catch((error: unknown) => {
  console.error("Unhandled error in main:", error);
  process.exit(1);
});
