import config from "@/config";
import { getClient } from "@/database";
import { JoinRequest } from "@/interfaces";
import { getLogger } from "@/logger";
import { Routes } from "discord-api-types/v10";
import { Hono } from "hono";
const app = new Hono();

const logger = getLogger("JoinRequest");

app.post("/", async (c) => {
  const rawData = await c.req.json();
  const { code, token } = rawData;
  logger.info(`Code: ${code}`);
  if (!code || !token) {
    return c.json({ error: "No code or Turnstile token provided" });
  }
  if (!c.env) {
    return c.json({ error: "Developer Error: No env provided" });
  }
  if (!c.env.TURNSTILE_SECRET || typeof c.env.TURNSTILE_SECRET !== "string") {
    return c.json({ error: "Developer Error: No TURNSTILE_SECRET provided" });
  }
  const turnstileResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      response: token,
      secret: c.env.TURNSTILE_SECRET,
    }).toString()
  });
  const turnstileData = await turnstileResponse.json();
  logger.info(`Turnstile response: ${JSON.stringify(turnstileData)}`);
  if (!turnstileData.success) {
    return c.json({ error: "Invalid Turnstile token" });
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
      redirect_uri: config.joinrequestCallback,
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

  const client = await getClient(c.env as Record<string, string>);
  const joinrequestDB = client.db("bot").collection<JoinRequest>("joinrequests");
  const joinrequest = await joinrequestDB.findOne({ discord_id: user.id });
  if (joinrequest) {
    return c.json({ error: "Already requested" });
  }
  
  await joinrequestDB.insertOne({
    discord_id: user.id,
    created_at: new Date(),
    access_token,
  });
  await fetch(`https://discord.com/api/v10${Routes.channelMessages(config.joinLog)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bot ${c.env.DISCORD_TOKEN as string}`
    },
    body: JSON.stringify({
      embeds: [{
        title: "Join Request Received",
        description: `@${user.username} (${user.id}) has requested to join the server.`,
        footer: { text: "Only sudoers can Approve/Decline request." }
      }]
    })
  });
  return c.json({ success: true });
});

export default app;