import { Hono } from "hono";
import interactionsRouter from "./interactions";
import cron from "@/cron";

const app = new Hono();

app.get("/", (c) => c.text("Hello World!"));

app.route("/interactions", interactionsRouter);

export default {
  fetch: app.fetch,
  scheduled: cron,
};
