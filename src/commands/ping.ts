import { Awaitable, Command } from "@/interfaces";
import { APIInteractionResponseChannelMessageWithSource, InteractionResponseType } from "discord-api-types/v10";

export class Ping extends Command {
  name = "ping";
  execute(): Awaitable<APIInteractionResponseChannelMessageWithSource> {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: "Pong!"
      }
    };
  }
}