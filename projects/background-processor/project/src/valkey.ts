import { Redis } from "ioredis";
import { getEnvVar } from "./utils.js";

export function getValkeyConnectionString(): string {
  return getEnvVar("VALKEY_URL");
}

export function createValkeyConnection() {
  return new Redis(getValkeyConnectionString(), {
    maxRetriesPerRequest: null,
  });
}
