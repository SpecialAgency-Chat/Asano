import { APIApplicationCommandInteractionDataOption, APIApplicationCommandInteractionDataIntegerOption, ApplicationCommandOptionType } from "discord-api-types/v10";

export function isInteger(option: APIApplicationCommandInteractionDataOption): option is APIApplicationCommandInteractionDataIntegerOption {
  return option.type === ApplicationCommandOptionType.Integer;
}