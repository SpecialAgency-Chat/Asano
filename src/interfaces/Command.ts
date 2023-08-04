import {
  APIChatInputApplicationCommandInteraction,
  APIInteractionResponseChannelMessageWithSource,
} from "discord-api-types/v10";
import { Awaitable } from "./types";
import { Bindings } from "hono/dist/types/types";
export abstract class Command {
  public abstract name: string;
  public abstract execute(
    interaction: APIChatInputApplicationCommandInteraction,
    env: Bindings,
  ): Awaitable<APIInteractionResponseChannelMessageWithSource>;
}
