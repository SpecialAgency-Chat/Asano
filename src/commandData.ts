import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10";

const commandData: RESTPostAPIApplicationCommandsJSONBody[] = [
  {
    name: "ping",
    description: "Ping the bot"
  },
  {
    name: "sudo",
    description: "Enter sudo mode",
    dm_permission: false
  },
  {
    name: "exit",
    description: "Exit sudo mode",
    dm_permission: false
  },
  {
    name: "key",
    description: "Get invite key",
    dm_permission: false,
    options: [
      {
        type: ApplicationCommandOptionType.Integer,
        name: "expires",
        description: "Invite key expiration time (If not specified, the key will never expire)",
        choices: [
          {
            name: "1 minute",
            value: 60
          },
          {
            name: "5 minutes",
            value: 300
          },
          {
            name: "1 hour",
            value: 3600
          },
          {
            name: "1 day",
            value: 86400
          },
          {
            name: "1 week",
            value: 604800
          }
        ]
      }
    ]
  }
];

export default commandData;