import { MessageFlags, SlashCommandBuilder } from "discord.js";

import type { GuildMember } from "discord.js";
import type { Command } from '../types.ts'
import { lavalink } from "../lavalink.ts";

export default {
    data: new SlashCommandBuilder()
        .setName("stopplaying").setDescription("Stops the player without leaving")
        .addBooleanOption(o => o.setName("clear_queue").setDescription("Should the queue be cleared? (default true)").setRequired(false))
        .addBooleanOption(o => o.setName("execute_autoplay").setDescription("Should autoplay function be executed? (default false)").setRequired(false)),
    execute: async (interaction, client) => {
        if (!interaction.guildId) return;

        const vcId = (interaction.member as GuildMember)?.voice?.channelId;
        if (!vcId) return interaction.reply({ flags: [MessageFlags.Ephemeral], content: "Join a Voice Channel " });

        const player = lavalink.getPlayer(interaction.guildId);
        if (!player) return interaction.reply({ flags: [MessageFlags.Ephemeral], content: "I'm not connected" });
        if (player.voiceChannelId !== vcId) return interaction.reply({ flags: [MessageFlags.Ephemeral], content: "You need to be in my Voice Channel" })
        if (!interaction.isChatInputCommand()) return;
        await player.stopPlaying(interaction.options?.getBoolean?.("clear_queue") ?? true, interaction.options?.getBoolean?.("execute_autoplay") ?? false);

        interaction.reply({ content: "Stopped the player without leaving" });
    }
} as Command;
