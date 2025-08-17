import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { CommandInteractionOptionResolver, GuildMember } from "discord.js";
import type { Command } from "../types";
import { lavalink } from "../lavalink";

export default {
    data: new SlashCommandBuilder()
        .setName("volume")
        .setDescription("Change or check the Volume of the Player")
        .addIntegerOption((o) =>
            o
                .setName("percentage")
                .setDescription("To what Volume do you want to change")
                .setMaxValue(200)
                .setMinValue(0)
                .setRequired(false) // optional now
        )
        .addStringOption((o) =>
            o
                .setName("ignoredecrementer")
                .setDescription("Should the Decrementer be ignored?")
                .setRequired(false)
                .setChoices(
                    { name: "True", value: "true" },
                    { name: "False", value: "false" }
                )
        ),
    execute: async (interaction, client) => {
        if (!interaction.guildId) return;

        const vcId = (interaction.member as GuildMember)?.voice?.channelId;
        if (!vcId)
            return interaction.reply({
                flags: [MessageFlags.Ephemeral],
                content: "Join a Voice Channel",
            });
        if (!interaction.isChatInputCommand()) return;

        const player = lavalink.getPlayer(interaction.guildId);
        if (!player)
            return interaction.reply({
                flags: [MessageFlags.Ephemeral],
                content: "I'm not connected",
            });
        if (player.voiceChannelId !== vcId)
            return interaction.reply({
                flags: [MessageFlags.Ephemeral],
                content: "You need to be in my Voice Channel",
            });

        if (!player.queue.current)
            return interaction.reply({
                flags: [MessageFlags.Ephemeral],
                content: "I'm not playing anything",
            });

        const newVol = interaction.options.getInteger("percentage");
        const ignoreDecrementer =
            ((interaction.options as CommandInteractionOptionResolver).getString(
                "ignoredecrementer"
            ) as string) === "true";

        if (newVol === null) {
            // No percentage provided → just show current volume
            return interaction.reply({
                flags: [MessageFlags.Ephemeral],
                content: `Current volume is: \`${player.volume}\``,
            });
        }

        if (player.volume === newVol) {
            return interaction.reply({
                flags: [MessageFlags.Ephemeral],
                content: `The volume is already set to: \`${newVol}\``,
            });
        }

        await player.setVolume(newVol, ignoreDecrementer);
        await interaction.reply({
            flags: [MessageFlags.Ephemeral],
            content: `Changed volume to: \`${player.volume}\``,
        });
    },
} as Command;
