import { Command } from "@/interfaces";
import {
  APIInteractionResponseChannelMessageWithSource,
  InteractionResponseType,
  MessageFlags,
} from "discord-api-types/v10";

export class Ping extends Command {
  name = "ping";
  execute(): APIInteractionResponseChannelMessageWithSource {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: "Pong!",
        flags: MessageFlags.Ephemeral,
      },
    };
  }
}
