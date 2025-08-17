import {
    DiscordAPIError,
    EmbedBuilder,
    MessageFlags,
    SlashCommandBuilder
} from "discord.js";

import type { GuildMember } from "discord.js";
import type { Command } from "../types.ts";
import { lavalink } from "../lavalink.ts";
import { formatMS_HHMMSS } from "../utils/time";
import type { Track } from "lavalink-client";

// Store intervals to avoid multiple updates per guild
const npIntervals = new Map<string, NodeJS.Timeout>();

export default {
    data: new SlashCommandBuilder()
        .setName("now-playing")
        .setDescription("Shows current track."),

    execute: async (interaction, client) => {
        if (!interaction.guildId) return;

        const vcId = (interaction.member as GuildMember)?.voice?.channelId;
        if (!vcId) {
            return interaction.reply({
                flags: [MessageFlags.Ephemeral],
                content: "Join a Voice Channel first!"
            });
        }

        const player = lavalink.getPlayer(interaction.guildId);
        if (!player) {
            return interaction.reply({
                flags: [MessageFlags.Ephemeral],
                content: "I'm not connected to any voice channel."
            });
        }

        if (player.voiceChannelId !== vcId) {
            return interaction.reply({
                flags: [MessageFlags.Ephemeral],
                content: "You need to be in the same voice channel as me!"
            });
        }

        if (!player.queue.current) {
            return interaction.reply({
                flags: [MessageFlags.Ephemeral],
                content: "No track is currently playing."
            });
        }

        const duration = player.queue.current.info.duration;
        if (!duration) {
            return interaction.reply({
                flags: [MessageFlags.Ephemeral],
                content: "Unable to fetch track duration."
            });
        }

        // Stop any existing interval
        if (npIntervals.has(interaction.guildId)) {
            clearInterval(npIntervals.get(interaction.guildId));
            npIntervals.delete(interaction.guildId);
        }

        const buildBar = (position: number, duration: number) => {
            const percent = Math.floor((position / duration) * 100);
            const totalBars = 20;
            const progress = Math.round((percent / 100) * totalBars);
            const bar = "▬".repeat(progress) + "🔵" + "▬".repeat(totalBars - progress);
            return { bar, percent };
        };

        const position = player.position;
        const { bar } = buildBar(position, duration);
        const positionFormatted = formatMS_HHMMSS(position);
        const durationFormatted = formatMS_HHMMSS(duration);

        const response = await interaction.reply({
            embeds: [getNowPlayingEmbed(player.queue.current, bar, positionFormatted, durationFormatted, interaction.user.id)],
            withResponse: true
        });
        const message = response.resource?.message;
        if (!message) return;

        // Create updater interval
        const interval = setInterval(async () => {
            if (!player.queue.current || player.position >= duration) {
                clearInterval(interval);
                // if (!interaction.guildId) return;
                npIntervals.delete(interaction.guildId!);
                return;
            }

            const pos = player.position;
            const { bar } = buildBar(pos, duration);
            const posFormatted = formatMS_HHMMSS(pos);

            try {
                await message.edit({ embeds: [getNowPlayingEmbed(player.queue.current, bar, posFormatted, durationFormatted, interaction.user.id)] });
            } catch (err) {
                if (err instanceof DiscordAPIError && err.code === 10008) {
                    // Message was deleted
                    clearInterval(interval);
                    npIntervals.delete(interaction.guildId!);
                    console.log("Updater stopped: message was deleted.");
                    // console.error("Failed to edit message:", err);
                    console.log("Failed to edit message:",);
                } else {
                    console.log("Failed to edit message");
                }
            }

        }, 5000); // 5 second

        // Save interval
        npIntervals.set(interaction.guildId, interval);

    }
} as Command;

const getNowPlayingEmbed = (track: Track, bar: string, positionFormatted: string, durationFormatted: string, userid: string) => {
    return new EmbedBuilder()
        .setDescription(
            `[${track.info.title}](${track.info.uri}) [<@${userid}>]`
        )
        .setFooter({ "text": `${bar} ${positionFormatted} / ${durationFormatted}` })

}