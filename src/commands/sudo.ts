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

const logger = getLogger("Sudo");

export class Sudo extends Command {
  name = "sudo";
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
          content: `${interaction.member.user.username} does not have the sudoers role.  This incident will be reported.`,
        },
      };
    }
    if (roles.includes(config.root)) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: "sudo-loop detected. Maybe you are already in sudo.",
          flags: MessageFlags.Ephemeral,
        },
      };
    }
    const client = await getClient(env);
    const sudoingDb = client.db("bot").collection<Sudoing>("sudoing");
    await sudoingDb.insertOne({
      discord_id: interaction.member.user.id,
      executed_at: new Date(),
    });
    try {
      await discord.put(
        Routes.guildMemberRole(
          interaction.guild_id,
          interaction.member.user.id,
          config.root,
        ),
        {},
        `Executed sudo.`,
      );
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: `We trust you have received the usual lecture from the local Server\nAdministrator. It usually boils down to these three things:\n\n    #1) Respect the privacy of others.\n    #2) Think before you do.\n    #3) With great power comes great responsibility.`,
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
