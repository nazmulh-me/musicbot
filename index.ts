import { Client, GatewayIntentBits, Collection } from "discord.js";
import fs from "fs";
import path from "path";
import type { Command } from "./src/types";

const intents = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
];
export const commands = new Collection<string, Command>();
export const client = new Client({ intents });
const commandsPath = path.join(__dirname, "./src/commands");
const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".ts"));

for (const file of commandFiles) {
    const { default: command } = await import(path.join(commandsPath, file));
    commands.set(command.data.name, command);
}

const eventsPath = path.join(__dirname, "./src/events");
const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith(".ts"));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const { default: event } = await import(filePath);

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

client.login(process.env.TOKEN);
