import config from "@/config";
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
});

app.post("/callback", async (c) => {
  const { code, inviteCode } = await c.req.json();
  if (!code || !inviteCode) {
    return c.json({ error: "No code provided" });
  }
  if (inviteCode.length !== 8) {
    return c.json({ error: "Invalid code" });
  }
  if (!c.env) {
    return c.json({ error: "Developer Error: No env provided" });
  }
  const client = await getClient(c.env as Record<string, string>);
  const invitesDB = client.db("bot").collection<Invite>("invites");
  const invite = await invitesDB.findOne({ code: inviteCode });
  if (!invite) {
    return c.json({ error: "Invalid code" });
  }
  if (invite.expires && (new Date().getTime() - invite.created_at.getTime()) > invite.expires * 1000) {
    await invitesDB.deleteOne({ code: inviteCode });
    return c.json({ error: "Code expired" });
  }
  const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: c.env.DISCORD_CLIENT_ID as string,
      client_secret: c.env.DISCORD_CLIENT_SECRET as string,
      grant_type: "authorization_code",
      code,
      redirect_uri: config.inviteCallback,
    })
  });
})

export default app;