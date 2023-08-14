import { getClient } from "@/database";
import { User } from "@/interfaces";
import { getLogger } from "@/logger";

const logger = getLogger("RefreshTokens");

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function refreshTokens(_: unknown, env: Record<string, string>) {
  const client = await getClient(env);
  //const discord = new DiscordManager(env.DISCORD_TOKEN as string);
  const usersDb = client.db("bot").collection<User>("users");
  // 今日の日付
  const currentDate = new Date();
  // 3日前
  currentDate.setDate(currentDate.getDate() - 3);
  // 更新が3日前のユーザーを抽出する
  const users = await usersDb.find({ updated_at: { $lt: currentDate } });
  for (const user of users) {
    // 0, 1, 2, 3, 4
    const r = Math.floor(Math.random() * 5);
    if (
      r !== 0 &&
      Date.now() - user.updated_at.getTime() < 1000 * 60 * 60 * 24 * 6
    )
      continue; // 1/5の確率で更新する。また6日経過していた場合通す
    logger.debug(user);
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID as string,
        client_secret: env.DISCORD_CLIENT_SECRET as string,
        grant_type: "refresh_token",
        refresh_token: user.refresh_token,
      }),
    });
    const { access_token, refresh_token } = await tokenResponse.json();
    await usersDb.updateOne({ discord_id: user.discord_id }, {
      $set: { access_token, refresh_token, updated_at: new Date() }
    });
    logger.debug(`Updated: ${user.discord_id}`);
  }
}
