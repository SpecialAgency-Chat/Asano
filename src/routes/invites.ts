import config from "@/config";
import { getClient } from "@/database";
import { Invite } from "@/interfaces";
import { getLogger } from "@/logger";
import { Routes } from "discord-api-types/v10";
import { Hono } from "hono";
const app = new Hono();

const logger = getLogger("Invites");

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
  const { code, state: inviteCode } = await c.req.json();
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
  logger.info(`Code ${inviteCode} used by ${code}`);
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
  const { access_token, scope } = await tokenResponse.json();
  logger.info(`Access token: ${access_token}`);
  logger.info(`Scope: ${scope}`);
  if (!access_token) {
    return c.json({ error: "Invalid code" });
  }
  if (!scope.includes("identify") || !scope.includes("guilds.join") || !scope.includes("role_connections.write")) {
    return c.json({ error: "Scope not valid" });
  }
  const user = await (await fetch("https://discord.com/api/v10/users/@me", {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${access_token}`
    }
  })).json();
  logger.info(`User: ${JSON.stringify(user)}`);
  const addResponse = await fetch(`https://discord.com/api/v10${Routes.guildMember(config.guildId, user.id)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bot ${c.env.DISCORD_TOKEN as string}`
    },
    body: JSON.stringify({
      access_token,
    })
  });
  if (!addResponse.ok) {
    return c.json({ error: "Error adding user to guild" });
  }
  await invitesDB.deleteOne({ code: inviteCode });
  return c.json({ success: true });
});

export default app;