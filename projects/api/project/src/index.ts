import { Context, Hono } from "hono";
import { cors } from "hono/cors";
import type { AppBindings } from "./bindings";
import { status } from "./routes/status";

const app = new Hono<{ Bindings: AppBindings }>();

app.use(
  "/*",
  cors({
    origin: (origin, ctx: Context<{ Bindings: AppBindings }>) => {
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

app.get("/health", (c) => c.json({ status: "ok" }));

export default app;
