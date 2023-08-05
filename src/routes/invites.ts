import { getClient } from "@/database";
import { Invite } from "@/interfaces";
import { Hono } from "hono";
const app = new Hono();

app.get("/", async (c) => {
  const code = c.req.query("code");
  if (!code) {
    return c.json({ error: "No code provided" });
  }
  if (code.length !== 8) {
    return c.json({ error: "Invalid code" });
  }
  const client = await getClient(c.env as Record<string, string>);
  const invitesDB = client.db("bot").collection<Invite>("invites");
  const invite = await invitesDB.findOne({ code });
  if (!invite) {
    return c.json({ error: "Invalid code" });
  }
  if (invite.expires && (new Date().getTime() - invite.created_at.getTime()) > invite.expires * 1000) {
    await invitesDB.deleteOne({ code });
    return c.json({ error: "Code expired" });
  }
  return c.json({ code: invite.code, exists: true });
})

export default app;