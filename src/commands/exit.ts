import { Command, Sudoing } from "@/interfaces";
import {
  APIChatInputApplicationCommandGuildInteraction,
  APIInteractionResponseChannelMessageWithSource,
  InteractionResponseType,
  MessageFlags,
  Routes,
} from "discord-api-types/v10";
import config from "@/config";
import { getClient } from "@/database";
import { DiscordManager } from "@/discord";
import { getLogger } from "@/logger";

const logger = getLogger("Exit");

export class Exit extends Command {
  name = "exit";
  async execute(
    interaction: APIChatInputApplicationCommandGuildInteraction,
    env: Record<string, string>,
  ): Promise<APIInteractionResponseChannelMessageWithSource> {
    const roles = interaction.member.roles;
    const discord = new DiscordManager(env.DISCORD_TOKEN as string);
    if (config.sudoers.every((roleId) => !roles.includes(roleId))) {
      // sudoers 対象ロールがひとつも付与されていない
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: `${interaction.member.user.username} is not in the sudoers file.  This incident will be reported.`,
        },
      };
    }
    if (!roles.includes(config.root)) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: "You're not in sudo.",
          flags: MessageFlags.Ephemeral,
        },
      };
    }
    const client = await getClient(env);
    const sudoingDb = client.db("bot").collection<Sudoing>("sudoing");
    const data = await sudoingDb.findOne({
      discord_id: interaction.member.user.id,
    });
    try {
      await discord.delete(
        Routes.guildMemberRole(
          interaction.guild_id,
          interaction.member.user.id,
          config.root,
        ),
        {},
        `User exited sudo expressly.`,
      );
      if (data) {
        await sudoingDb.deleteOne({ discord_id: interaction.member.user.id });
      }
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: `\`\`\`ansi\n[2;36m@root[0m ➜[1;2m[1;34m/guilds/sac[0m[0m $ logout\n${
            !data ? "[2;33mWarning: You're not in sudo in db.[0m\n" : ""
          }[2;36m@${
            interaction.member.user.username
          }[0m ➜[1;2m[1;34m/guilds/sac[0m[0m $\n\`\`\``,
          flags: MessageFlags.Ephemeral,
        },
      };
    } catch (err: unknown) {
      logger.error(err);
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: `An error was occcured: ${
            err instanceof Error ? err.toString() : err
          }`,
        },
      };
    }
  }
}
