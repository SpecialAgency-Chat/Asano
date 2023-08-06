import {
  APIInteractionResponseChannelMessageWithSource,
  APIInteractionResponseUpdateMessage,
  APIMessageComponentInteraction,
} from "discord-api-types/v10";
import { Awaitable } from "./types";
import { Bindings } from "hono/dist/types/types";
export abstract class Action {
  public abstract name: string;
  public abstract execute(
    interaction: APIMessageComponentInteraction,
    env: Bindings,
  ): Awaitable<
    | APIInteractionResponseChannelMessageWithSource
    | APIInteractionResponseUpdateMessage
  >;
}
