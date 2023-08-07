import { Routes } from "discord-api-types/v10";
import { getClient } from "../database";
import { DiscordManager } from "../discord";
import { Sudoing } from "../interfaces";
import config from "../config";
import { getLogger } from "../logger";

const logger = getLogger("RemoveSudo");

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async function cron(_: unknown, env: Record<string, string>) {
  const client = await getClient(env);
  const discord = new DiscordManager(env.DISCORD_TOKEN as string);
  const sudoingDb = client.db("bot").collection<Sudoing>("sudoing");
  const sudoings = await sudoingDb.find();
  logger.debug(sudoings);
  for (const sudoer of sudoings) {
    if (new Date().getTime() - sudoer.executed_at.getTime() > 1000 * 60 * 15) {
      logger.debug(sudoer);
      // 15 minutes
      await discord.delete(
        Routes.guildMemberRole(config.guildId, sudoer.discord_id, config.root),
        {},
        "sudo expired.",
      );
      await sudoingDb.deleteOne({ discord_id: sudoer.discord_id });
    }
  }
}
