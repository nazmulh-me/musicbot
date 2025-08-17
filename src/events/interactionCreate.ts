import type { BaseInteraction } from "discord.js";
import { commands } from "../..";
export default {
    name: "interactionCreate",
    async execute(interaction: BaseInteraction) {
        if (!interaction.isCommand() && !interaction.isAutocomplete()) return;

        const command = commands.get(interaction.commandName);
        if (!command) return;

        if (interaction.isCommand()) {
            try {
                await command.execute(interaction, interaction.client);
            } catch (error) {
                console.error("Command Error:", error);
                await interaction.reply("There was an error executing this command.");
            }
        }

        if (interaction.isAutocomplete()) {
            if (!command.autocomplete)
                return console.error(
                    `[Command-Error] Command is missing property "autocomplete".`
                );
            return await command.autocomplete?.(interaction, interaction.client);
        }
    },
};
