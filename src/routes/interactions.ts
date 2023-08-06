import { Hono } from "hono";
import { verifyDiscordRequest } from "@/verifyDiscordRequest";
import { getLogger } from "@/logger";
import {
  APIInteractionResponseChannelMessageWithSource,
  APIInteractionResponsePong,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
} from "discord-api-types/v10";
import { isChatInputApplicationCommandInteraction } from "discord-api-types/utils/v10";
import { Action, Command } from "@/interfaces";

import { Ping, Sudo, Exit, Key } from "@/commands";
import { Approve } from "@/actions";

const commands = new Map<string, Command>();
commands.set("ping", new Ping());
commands.set("sudo", new Sudo());
commands.set("exit", new Exit());
commands.set("key", new Key());

const actions = new Map<string, Action>();
actions.set("approve", new Approve());

const app = new Hono();
const logger = getLogger("Interactions");

app.all("/", async (c) => {
  logger.debug("Received request");
  logger.trace(c);
  const { isValid, interaction } = await verifyDiscordRequest(c);
  if (!isValid) {
    logger.warn("Invalid request");
    c.status(401);
    return c.text("Invalid request");
  }

  if (interaction.type === InteractionType.Ping) {
    return c.json<APIInteractionResponsePong>({
      type: InteractionResponseType.Pong,
    });
  }

  if (interaction.type === InteractionType.ApplicationCommand) {
    if (isChatInputApplicationCommandInteraction(interaction)) {
      logger.info("Received command");
      const commandName = interaction.data.name;
      const command = commands.get(commandName);
      if (!command) {
        logger.warn("Command not found");
        return c.json<APIInteractionResponseChannelMessageWithSource>({
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: "Command not found",
            flags: MessageFlags.Ephemeral,
          },
        });
      }
      logger.info("Executing command");
      if (!c.env) throw new Error("Missing env");
      const response = await command.execute(interaction, c.env);
      logger.info("Command executed");
      return c.json<APIInteractionResponseChannelMessageWithSource>(response);
    }
  } else if (interaction.type === InteractionType.MessageComponent) {
    logger.info("Received action");
    const actionName = interaction.data.custom_id;
    let action = actions.get(actionName);
    if (!action) {
      action = actions.get(actionName.split("__")[0]!);
    }
    if (!action) {
      logger.warn("Action not found");
      return c.json<APIInteractionResponseChannelMessageWithSource>({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: "Action not found",
          flags: MessageFlags.Ephemeral,
        },
      });
    }
    logger.info("Executing action");
    if (!c.env) throw new Error("Missing env");
    const response = await action.execute(interaction, c.env);
    logger.info("Action executed");
    return c.json(response);
  }
});

export default app;
