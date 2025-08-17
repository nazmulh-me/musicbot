import {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} from "discord.js";
import type { Command } from "../types.ts";
import { lavalink } from "../lavalink.ts";

const activePlaylists = new Map<string, NodeJS.Timeout>();

export default {
    data: new SlashCommandBuilder()
        .setName("playlist")
        .setDescription("View the current playlist queue"),

    execute: async (interaction) => {
        if (!interaction.guildId) return;
        const guildId = interaction.guildId;

        const player = lavalink.getPlayer(guildId);
        if (!player || !player.queue.current) {
            return interaction.reply({
                content: "Nothing is currently playing.",
                flags: [MessageFlags.Ephemeral]
            });
        }

        const queue = [player.queue.current, ...player.queue.tracks];
        const pageSize = 10;
        let page = 0;
        let totalPages = Math.ceil(queue.length / pageSize);

        // Cancel previous playlist interaction and clear timeout
        if (activePlaylists.has(guildId)) {
            clearTimeout(activePlaylists.get(guildId));
            activePlaylists.delete(guildId);
        }

        const getPageEmbed = (page: number) => {
            const start = page * pageSize;
            const end = start + pageSize;
            const currentTracks = queue.slice(start, end);

            return new EmbedBuilder()
                .setTitle("🎶 Playlist Queue")
                .setColor(0x00AE86)
                .setDescription(
                    currentTracks.map((track, i) => {
                        const index = start + i;
                        const prefix = index === 0 ? "**▶ Now Playing**" : `\`${index}.\``;
                        return `${prefix} [${track.info.title}](${track.info.uri})`;
                    }).join("\n")
                )
                .setFooter({ text: `Page ${page + 1} / ${totalPages}` });
        };

        const getButtons = () =>
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId("prev")
                    .setLabel("◀ Prev")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 0),

                new ButtonBuilder()
                    .setCustomId("next")
                    .setLabel("Next ▶")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === totalPages - 1),

                new ButtonBuilder()
                    .setCustomId("stop")
                    .setLabel("⏹ Stop")
                    .setStyle(ButtonStyle.Danger)
            );

        const message = await interaction.reply({
            embeds: [getPageEmbed(page)],
            components: [getButtons()],
            withResponse: true
        });

        const rawMessage = message.resource?.message;
        if (!rawMessage) return;

        let lastQueueLength = queue.length;
        let updateInterval: NodeJS.Timeout | undefined;

        const collector = rawMessage.createMessageComponentCollector({
            time: 3 * 60 * 1000,
            filter: () => true
        });

        if (!collector) return;

        collector.on("collect", async i => {
            if (i.customId === "stop") {
                if (i.user.id !== interaction.user.id) {
                    if (!i.replied && !i.deferred) {
                        await i.reply({
                            content: "❌ Only the user who started this playlist can stop it.",
                            ephemeral: true
                        });
                    }
                    return;
                }

                collector.stop("stoppedByUser");
                clearInterval(updateInterval);

                if (!i.replied && !i.deferred) {
                    await i.update({
                        content: "🛑 Playlist navigation stopped.",
                        embeds: [getPageEmbed(page)],
                        components: []
                    });
                } else {
                    await i.followUp({
                        content: "🛑 Playlist navigation stopped.",
                        ephemeral: true
                    });
                    await rawMessage.edit({
                        embeds: [getPageEmbed(page)],
                        components: []
                    });
                }

                return;
            }

            // Prev/Next buttons are accessible by anyone
            if (i.customId === "prev" && page > 0) page--;
            else if (i.customId === "next" && page < totalPages - 1) page++;

            if (!i.replied && !i.deferred) {
                await i.update({
                    embeds: [getPageEmbed(page)],
                    components: [getButtons()]
                });
            }
        });

        collector.on("end", async (_collected, reason) => {
            try {
                clearInterval(updateInterval);
                await rawMessage.edit({ components: [] });
            } catch (err) {
                console.warn("Failed to remove playlist buttons:", err);
            }
            activePlaylists.delete(guildId);
        });

        updateInterval = setInterval(async () => {
            const currentPlayer = lavalink.getPlayer(guildId);
            if (!currentPlayer || !currentPlayer.queue.current) return;

            const newQueue = [currentPlayer.queue.current, ...currentPlayer.queue.tracks];
            if (newQueue.length !== lastQueueLength) {
                lastQueueLength = newQueue.length;

                queue.length = 0;
                queue.push(...newQueue);
                totalPages = Math.ceil(queue.length / pageSize);

                if (page >= totalPages) page = totalPages - 1;

                await rawMessage.edit({
                    embeds: [getPageEmbed(page)],
                    components: [getButtons()]
                });
            }
        }, 5000);

        const timeout = setTimeout(() => {
            activePlaylists.delete(guildId);
        }, 3 * 60 * 1000);

        activePlaylists.set(guildId, timeout);
    }
} as Command;
