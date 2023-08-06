import dotenv from "dotenv";
import Commands from "./commandData";
import { APIApplicationRoleConnectionMetadata, Routes } from "discord-api-types/v10";

dotenv.config({ path: ".dev.vars" });

const token = process.env.DISCORD_TOKEN;
const applicationId = process.env.DISCORD_CLIENT_ID;

if (!token) {
  throw new Error("The DISCORD_TOKEN environment variable is required.");
}
if (!applicationId) {
  throw new Error("The DISCORD_CLIENT_ID environment variable is required.");
}

const url = `https://discord.com/api/v10${Routes.applicationCommands(applicationId)}`;

const response = await fetch(url, {
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bot ${token}`,
  },
  method: "PUT",
  body: JSON.stringify(Commands),
});

if (response.ok) {
  console.log("Registered all commands");
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
} else {
  console.error("Error registering commands");
  let errorText = `Error registering commands \n ${response.url}: ${response.status} ${response.statusText}`;
  try {
    const error = await response.text();
    if (error) {
      errorText = `${errorText} \n\n ${error}`;
    }
  } catch (err) {
    console.error("Error reading body from request:", err);
  }
  console.error(errorText);
  process.exit(1);
}

const url2 = `https://discord.com/api/v10${Routes.applicationRoleConnectionMetadata(applicationId)}`;

const metadata: APIApplicationRoleConnectionMetadata[] = [];

const response2 = await fetch(url2, {
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bot ${token}`,
  },
  method: "PUT",
  body: JSON.stringify(metadata),
});

if (response2.ok) {
  console.log("Registered all metadata");
  const data = await response2.json();
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
} else {
  console.error("Error registering metadata");
  let errorText = `Error registering metadata \n ${response2.url}: ${response2.status} ${response2.statusText}`;
  try {
    const error = await response2.text();
    if (error) {
      errorText = `${errorText} \n\n ${error}`;
    }
  } catch (err) {
    console.error("Error reading body from request:", err);
  }
  console.error(errorText);
  process.exit(1);
}
