import { MailboxProcess } from "./jobs/mailbox.js";

const processors = [new MailboxProcess()];

async function main() {
  console.log("Starting background processor...");

  try {
    await Promise.all(processors.map((processor) => processor.start()));
  } catch (error) {
    console.error("Fatal error in main loop:", error);
    process.exit(1);
  }
}

function shutdown() {
  console.log("Shutting down...");

  Promise.allSettled(processors.map((processor) => processor.stop()))
    .then(() => {
      console.log("Shutdown complete.");
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error("Error during shutdown:", error);
      process.exit(1);
    });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

main().catch((error: unknown) => {
  console.error("Error during migrations:", error);
  process.exit(1);
});
