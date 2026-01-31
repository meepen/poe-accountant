import { Redis } from "ioredis";
import { getEnvVar } from "../utils.js";
import { WorkerOptions } from "bullmq";

export function getValkeyConnectionString(): string {
  return getEnvVar("VALKEY_URL");
}

export function createValkeyConnection() {
  const valkey = new Redis(getValkeyConnectionString(), {
    maxRetriesPerRequest: null,
  });

  return {
    valkey,
    valkeyForBullMQ: valkey as unknown as WorkerOptions["connection"],
  };
}
