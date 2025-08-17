import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { CommandInteractionOptionResolver, GuildMember } from "discord.js";
import type { Command } from "../types.ts";
import { lavalink } from "../lavalink.ts";

export default {
    data: new SlashCommandBuilder()
        .setName("skip").setDescription("Skip the current track")
        .addIntegerOption(o => o.setName("skipto").setDescription("to which song to skip to?").setRequired(false)),
    execute: async (interaction, client) => {
        if (!interaction.guildId) return;

        const vcId = (interaction.member as GuildMember)?.voice?.channelId;
        if (!vcId) return interaction.reply({ flags: [MessageFlags.Ephemeral], content: "Join a Voice Channel " });

        const player = lavalink.getPlayer(interaction.guildId);
        if (!player) return interaction.reply({ flags: [MessageFlags.Ephemeral], content: "I'm not connected" });
        if (player.voiceChannelId !== vcId) return interaction.reply({ flags: [MessageFlags.Ephemeral], content: "You need to be in my Voice Channel" })

        const current = player.queue.current;
        const nextTrack = player.queue.tracks[0];

        if (!nextTrack) return interaction.reply({ flags: [MessageFlags.Ephemeral], content: `No Tracks to skip to` });
        if (!interaction.isChatInputCommand()) return;
        await player.skip((interaction.options as CommandInteractionOptionResolver).getInteger("skipto") || 0);

        await interaction.reply({
            flags: [MessageFlags.Ephemeral], content: current ?
                `Skipped [\`${current?.info.title}\`](<${current?.info.uri}>) -> [\`${nextTrack?.info.title}\`](<${nextTrack?.info.uri}>)` :
                `Skipped to [\`${nextTrack?.info.title}\`](<${nextTrack?.info.uri}>)`
        });
    }
} as Command;