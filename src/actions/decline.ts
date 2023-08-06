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
} from "discord-api-types/v10";

export class Decline extends Action {
  name = "decline";
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
          content: `${interaction.member.user.username} does not have the sudoers role.  Decline failed.`,
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
    await joinrequestDB.deleteOne({ discord_id: userId });
    return {
      type: InteractionResponseType.UpdateMessage,
      data: {
        embeds: [
          {
            title: "Join Request Declined",
            description: `@${interaction.member.user.username} has declined <@${userId}> to join the server.`,
            color: 0xff0000,
          },
        ],
        components: [],
      },
    };
  }
}
