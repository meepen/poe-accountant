import {
  ApiEndpoint,
  ApiEndpointMethods,
} from "@meepen/poe-accountant-api-schema/api/api-endpoints.enum";
import { Hono } from "hono";
import { AppEnv } from "../bindings";
import { getSessionUser } from "../db/user";
import { getValkey } from "../valkey";
import { getDb } from "../db";
import { UserJobDto } from "@meepen/poe-accountant-api-schema/api/user.job.dto";
import { z } from "zod";

export const user = new Hono<AppEnv>();

ApiEndpoint.GetUser satisfies "user";
ApiEndpointMethods[ApiEndpoint.GetUser] satisfies "GET";
user.get("/", async (c) => {
  const user = await getSessionUser(getValkey(c.env), c);

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json(user);
});

ApiEndpoint.GetUserJobs satisfies "user/jobs";
ApiEndpointMethods[ApiEndpoint.GetUserJobs] satisfies "GET";
user.get("/jobs", async (c) => {
  const user = await getSessionUser(getValkey(c.env), c);

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = getDb(c.env);

  const jobs = await db.query.UserJobs.findMany({
    where: (uj, { eq }) => eq(uj.userId, user.id),
    orderBy: (uj, { desc }) => [desc(uj.createdAt)],
  });

  return c.json(
    z.array(UserJobDto).parse(
      jobs.map<z.infer<typeof UserJobDto>>((job) => ({
        id: job.jobId,
        isComplete: job.isComplete,
        statusText: job.statusText,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
      })),
    ),
  );
});
