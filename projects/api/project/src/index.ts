import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppBindings } from "./bindings";
import { status } from "./routes/status";

const app = new Hono<{ Bindings: AppBindings }>();

app.use("*", async (c, next) => {
  const origins = c.env.CORS_ORIGIN.split(",").map((x) => x.trim());
  return cors({
    origin: origins,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  })(c, next);
});

app.route("/status", status);

export default app;
