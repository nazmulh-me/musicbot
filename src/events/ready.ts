import { REST, Routes, ActivityType, Client } from "discord.js";
import { commands } from "../..";
import { lavalink } from "../lavalink";

export default {
    name: "ready",
    once: true,
    async execute(client: Client) {
        if (!client.isReady()) return;
        console.log(
            `\x1b[31m[ CORE ]\x1b[0m \x1b[32mBot Name:  \x1b[0m${client.user.tag}`
        );
        client.user.setActivity("Ami Bolbo | /play", { type: ActivityType.Listening });
        const commandsData = [];
        for (const command of commands.values().toArray()) {
            commandsData.push(command.data.toJSON());
        }

        const rest = new REST({ version: "10" }).setToken(client.token);

        try {
            await rest.put(Routes.applicationCommands(client.user.id), {
                body: commandsData,
            });
            console.log(
                "\x1b[31m[ CORE ]\x1b[0m \x1b[32m%s\x1b[0m",
                "Successfully reloaded Slash commands ✅"
            );
        } catch (error) {
            console.error("Error deploying commands:", error);
        }
        lavalink.init({ id: client.user!.id })
    },
};
