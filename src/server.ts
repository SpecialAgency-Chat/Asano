import { Hono } from "hono";
import { cors } from "hono/cors";
import interactionsRouter from "@/routes/interactions";
import invitesRouter from "@/routes/invites";
import joinrequestRouter from "@/routes/joinrequest";
import linkedRolesRouter from "@/routes/linked-roles";
import { ExportedHandler } from "@cloudflare/workers-types";

import cron from "@/cron";

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: "https://sachat.cloud",
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
app.route("/linked-roles", linkedRolesRouter);

const handler: ExportedHandler<Record<string, string>> = {
  // @ts-expect-error fuck type error
  fetch: app.fetch,
  async scheduled(event, env) {
    if (event.cron === "*/1 * * * *") {
      await cron(event, env);
    }
  }
};
export default handler;
