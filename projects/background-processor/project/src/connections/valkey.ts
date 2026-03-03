import { Redis } from "ioredis";
import { getEnvVar } from "../utils.js";
import type { WorkerOptions } from "bullmq";

function getValkeyConnectionString(): string {
  return getEnvVar("VALKEY_URL");
}

function createValkeyConnection() {
  const valkey = new Redis(getValkeyConnectionString(), {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });

  return {
    valkey,
    valkeyForBullMQ: valkey as unknown as WorkerOptions["connection"],
  };
}

export const valkey = createValkeyConnection().valkey;
export const valkeyForBullMQ = createValkeyConnection().valkeyForBullMQ;
