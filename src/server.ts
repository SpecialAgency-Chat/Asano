import { Hono } from "hono";
import { cors } from "hono/cors";
import interactionsRouter from "@/routes/interactions";
import invitesRouter from "@/routes/invites";
import joinrequestRouter from "@/routes/joinrequest";
import cron from "@/cron";

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: "http://sachat.cloud",
    allowMethods: ["POST", "GET", "OPTIONS", "HEAD"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

app.get("/", (c) => c.text("Hello World!"));

app.route("/interactions", interactionsRouter);
app.route("/invites", invitesRouter);
app.route("/joinrequest", joinrequestRouter);

export default {
  fetch: app.fetch,
  scheduled: cron,
};
