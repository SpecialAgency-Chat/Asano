import config from "@/config";
import { getClient } from "@/database";
import { Action, JoinRequest } from "@/interfaces";
import {
  isMessageComponentButtonInteraction,
  isMessageComponentGuildInteraction,
} from "discord-api-types/utils/v10";
import {
  APIInteractionResponseChannelMessageWithSource,
  APIInteractionResponseUpdateMessage,
  APIMessageComponentInteraction,
  InteractionResponseType,
  MessageFlags,
  Routes,
} from "discord-api-types/v10";

export class Approve extends Action {
  name = "approve";
  async execute(
    interaction: APIMessageComponentInteraction,
    env: Record<string, string>,
  ): Promise<
    | APIInteractionResponseChannelMessageWithSource
    | APIInteractionResponseUpdateMessage
  > {
    if (
      !isMessageComponentButtonInteraction(interaction) ||
      !isMessageComponentGuildInteraction(interaction)
    ) {
      throw new Error("Invalid interaction");
    }
    const roles = interaction.member.roles;
    if (config.sudoers.every((roleId) => !roles.includes(roleId))) {
      // sudoers 対象ロールがひとつも付与されていない
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: `${interaction.member.user.username} does not have the sudoers role.  Approve failed.`,
          flags: MessageFlags.Ephemeral,
        },
      };
    }
    const userId = interaction.data.custom_id.split("__")[1];
    if (!userId) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: "Invalid user id",
          flags: MessageFlags.Ephemeral,
        },
      };
    }
    const client = await getClient(env);
    const joinrequestDB = client
      .db("bot")
      .collection<JoinRequest>("joinrequests");
    const joinrequest = await joinrequestDB.findOne({ discord_id: userId });
    if (!joinrequest) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: "Join request not found",
          flags: MessageFlags.Ephemeral,
        },
      };
    }
    const addResponse = await fetch(
      `https://discord.com/api/v10${Routes.guildMember(
        interaction.guild_id,
        userId,
      )}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Audit-Log-Reason": `Approved by sudoers @${interaction.member.user.username}`,
          "Authorization": `Bot ${env.DISCORD_TOKEN}`
        },
        body: JSON.stringify({
          access_token: joinrequest.access_token,
        }),
      },
    );
    if (!addResponse.ok) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: "Failed to add user: " + (await addResponse.text()),
          flags: MessageFlags.Ephemeral,
        },
      };
    }
    return {
      type: InteractionResponseType.UpdateMessage,
      data: {
        embeds: [
          {
            title: "Join Request Approved",
            description: `@${interaction.member.user.username} has approved <@${userId}> to join the server.`,
            color: 0x00ff00,
          },
        ],
      },
    };
  }
}
