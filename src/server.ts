import { Hono } from "hono";
import interactionsRouter from "@/routes/interactions";
import invitesRouter from "@/routes/invites";
import joinrequestRouter from "@/routes/joinrequest";
import cron from "@/cron";

const app = new Hono();

app.get("/", (c) => c.text("Hello World!"));

app.route("/interactions", interactionsRouter);
app.route("/invites", invitesRouter);
app.route("/joinrequest", joinrequestRouter);

export default {
  fetch: app.fetch,
  scheduled: cron,
};
