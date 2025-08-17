import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { GuildMember } from "discord.js";
import type { Command } from "../types";
import { lavalink } from "../lavalink";

export default {
    data: new SlashCommandBuilder()
        .setName("disconnect")
        .setDescription("Disconnect the bot from the voice channel"),

    execute: async (interaction, _client) => {
        if (!interaction.guildId) return;

        const member = interaction.member as GuildMember;
        const vcId = member?.voice?.channelId;
        if (!vcId)
            return interaction.reply({
                flags: [MessageFlags.Ephemeral],
                content: "❌ You must be in a voice channel to disconnect me.",
            });

        const player = lavalink.getPlayer(interaction.guildId);
        if (!player || !player.connected)
            return interaction.reply({
                flags: [MessageFlags.Ephemeral],
                content: "❌ I'm not connected to any voice channel.",
            });

        if (player.voiceChannelId !== vcId)
            return interaction.reply({
                flags: [MessageFlags.Ephemeral],
                content: "❌ You need to be in my voice channel to disconnect me.",
            });

        await player.disconnect();

        await interaction.reply({
            flags: [MessageFlags.Ephemeral],
            content: "✅ Disconnected from the voice channel.",
        });
    },
} as Command;
