import { Redis } from "ioredis";
import { getEnvVar } from "../utils.js";
import { WorkerOptions } from "bullmq";

function getValkeyConnectionString(): string {
  return getEnvVar("VALKEY_URL");
}

function createValkeyConnection() {
  const valkey = new Redis(getValkeyConnectionString(), {
    maxRetriesPerRequest: null,
  });

  return {
    valkey,
    valkeyForBullMQ: valkey as unknown as WorkerOptions["connection"],
  };
}

export const valkey = createValkeyConnection().valkey;
export const valkeyForBullMQ = createValkeyConnection().valkeyForBullMQ;
