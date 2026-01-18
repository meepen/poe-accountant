import { Hono } from "hono";
import type { AppBindings } from "./bindings";
import { status } from "./routes/status";

const app = new Hono<{ Bindings: AppBindings }>();

app.route("/status", status);

export default app;
