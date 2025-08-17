import { SlashCommandBuilder, EmbedBuilder, CommandInteraction } from "discord.js";
import { commands } from "../..";

export default {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Shows all available commands"),

    async execute(interaction: CommandInteraction) {
        const helpEmbed = new EmbedBuilder()
            .setTitle("Help - Available Commands")
            .setDescription("- By : NazmuL")
            .setColor("#0099ff");

        commands.forEach((command) => {
            if (command.data && command.data.name && command.data.description) {
                helpEmbed.addFields({
                    name: `/${command.data.name}`,
                    value: command.data.description,
                });
            }
        });

        await interaction.reply({ embeds: [helpEmbed] });
    },
};
