import config from "@/config";
import { getClient } from "@/database";
import { User } from "@/interfaces";
import { getLogger } from "@/logger";
import { Routes } from "discord-api-types/v10";
import { Hono } from "hono";
const app = new Hono();

const logger = getLogger("LinkedRoles");

app.get("/", async (c) => {
  const code = c.req.query("code");
  logger.info(`Code: ${code}`);
  if (!code) {
    return c.json({ error: "No code provided" });
  }
  if (!c.env) {
    return c.json({ error: "Developer Error: No env provided" });
  }
  const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: c.env.DISCORD_CLIENT_ID as string,
      client_secret: c.env.DISCORD_CLIENT_SECRET as string,
      grant_type: "authorization_code",
      code,
      redirect_uri: config.linkedRolesCallback,
    }),
  });
  const { access_token, scope, refresh_token } = await tokenResponse.json();
  logger.info(`Access token: ${access_token}`);
  logger.info(`Scope: ${scope}`);
  if (!access_token) {
    return c.json({ error: "Invalid code" });
  }
  if (
    !scope.includes("identify") ||
    !scope.includes("guilds.join") ||
    !scope.includes("role_connections.write")
  ) {
    return c.json({ error: "Scope not valid" });
  }
  const user = await (
    await fetch("https://discord.com/api/v10/users/@me", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
    })
  ).json();
  logger.info(`User: ${JSON.stringify(user)}`);
  const client = await getClient(c.env as Record<string, string>);
  const usersDb = client.db("bot").collection<User>("users");
  const userDb = await usersDb.findOne({ discord_id: user.id });
  if (!userDb) {
    await usersDb.insertOne({
      discord_id: user.id,
      created_at: new Date(),
      access_token,
      refresh_token,
      updated_at: new Date(),
    });
  } else {
    await usersDb.updateOne(
      { discord_id: user.id },
      {
        $set: {
          access_token,
          refresh_token,
          updated_at: new Date(),
        },
      },
    );
  }
  logger.info("User saved");
  await fetch(
    `https://discord.com/api/v10${Routes.userApplicationRoleConnection(
      process.env.DISCORD_CLIENT_ID as string,
    )}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        platform_name: "SAC Manager v2",
        metadata: {
          verified: true,
        },
      }),
    },
  );
  logger.info("Role connection created");
  return c.text("Success. You may now close this window.");
});

export default app;
