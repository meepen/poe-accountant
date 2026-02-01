import { z } from "zod";

export const PoeApiJobName = "poe-api-job";
export enum PoeApiJobSpecialCase {
  None = "None",
  ExchangeRateRules = "ExchangeRateRules",
}

export const PoeApiJobSchema = z.object({
  endpointName: z.string(),
  ruleDetails: z.record(z.string(), z.string()),
  request: z.object({
    url: z.url(),
    method: z.string(),
    headers: z.record(z.string(), z.string()).optional(),
    body: z.string().optional(),
  }),
  specialCase: z.enum(PoeApiJobSpecialCase),
});

export const PoeApiJobReturnSchema = z.object({
  status: z.number(),
  result: z.string().optional(),
});
