import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppContext, AppEnv } from "./bindings";
import { status } from "./routes/status";
import { redirect } from "./routes/redirect";
import { user } from "./routes/user";
import { prices } from "./routes/prices";
import { league } from "./routes/league";

const app = new Hono<AppEnv>();

app.use(
  "/*",
  cors({
    origin: (origin, ctx: AppContext) => {
      const allowedOrigins = ctx.env.CORS_ORIGIN.split(",");
      if (
        allowedOrigins.includes(origin || "") ||
        allowedOrigins.includes("*")
      ) {
        return origin;
      }
      return "";
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
    credentials: true,
    maxAge: 24 * 60 * 60, // 1 day
  }),
);

app.route("/status", status);
app.route("/redirect", redirect);
app.route("/user", user);
app.route("/prices", prices);
app.route("/league", league);

app.get("/health", (c) => c.json({ status: "ok" }));

export default app;
