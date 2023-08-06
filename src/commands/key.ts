import { Command, Invite } from "@/interfaces";
import {
  APIChatInputApplicationCommandGuildInteraction,
  APIInteractionResponseChannelMessageWithSource,
  InteractionResponseType,
} from "discord-api-types/v10";
import config from "@/config";
import { getClient } from "@/database";
import { getLogger } from "@/logger";
import { isInteger } from "@/helper";

const logger = getLogger("Key");
const genRanHex = (size: number) =>
  [...Array(size)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");

export class Key extends Command {
  name = "key";
  async execute(
    interaction: APIChatInputApplicationCommandGuildInteraction,
    env: Record<string, string>,
  ): Promise<APIInteractionResponseChannelMessageWithSource> {
    const client = await getClient(env);
    const invitesDb = client.db("bot").collection<Invite>("invites");
    const code = genRanHex(8);
    await invitesDb.insertOne({
      issuer_id: interaction.member.user.id,
      code,
      expires: interaction.data.options?.filter(isInteger)[0]?.value || 0,
      created_at: new Date(),
    });
    logger.info(`Created ${code} invite`);
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: `${config.inviteBaseUrl}/?code=${code}`,
      },
    };
  }
}
