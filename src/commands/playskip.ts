import { MessageFlags, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { CommandInteractionOptionResolver, GuildMember, VoiceChannel } from "discord.js";
import type { SearchPlatform, SearchResult, Track } from "lavalink-client";
import type { Command } from "../types";
import { lavalink, defaultOptions } from "../lavalink";
import { formatMS_HHMMSS } from "../utils/time";

const autocompleteMap = new Map();

export default {
    data: new SlashCommandBuilder()
        .setName("playskip")
        .setDescription("Skip the current track and play a new one")
        .addStringOption((o) =>
            o
                .setName("source")
                .setDescription("From which Source you want to play?")
                .setRequired(true)
                .setChoices(
                    { name: "Youtube", value: "ytsearch" },
                    { name: "Youtube Music", value: "ytmsearch" },
                    { name: "Soundcloud", value: "scsearch" },
                    { name: "Deezer", value: "dzsearch" },
                    { name: "Spotify", value: "spsearch" },
                    { name: "Apple Music", value: "amsearch" },
                    { name: "Bandcamp", value: "bcsearch" },
                    { name: "Cornhub", value: "phsearch" }
                )
        )
        .addStringOption((o) =>
            o
                .setName("query")
                .setDescription("What to play?")
                .setAutocomplete(true)
                .setRequired(true)
        ),

    execute: async (interaction, _client) => {
        if (!interaction.guildId || !interaction.isChatInputCommand()) return;

        const member = interaction.member as GuildMember;
        const vcId = member?.voice?.channelId;
        if (!vcId)
            return interaction.reply({ content: "❌ You must join a voice channel first.", flags: [MessageFlags.Ephemeral] });

        const vc = member.voice.channel as VoiceChannel;
        if (!vc.joinable || !vc.speakable)
            return interaction.reply({ content: "❌ I cannot join or speak in your channel.", flags: [MessageFlags.Ephemeral] });

        const src = (interaction.options as CommandInteractionOptionResolver).getString("source") as SearchPlatform;
        let query = (interaction.options as CommandInteractionOptionResolver).getString("query") as string;

        const player = lavalink.getPlayer(interaction.guildId);
        if (!player || !player.queue.current) {
            const embed = new EmbedBuilder()
                .setColor(0xe74c3c)
                .setTitle("❌ Cannot Skip")
                .setDescription("There is no track currently playing to skip.")
            return interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
        }

        // Ensure player is connected
        if (!player.connected) await player.connect();
        if (player.voiceChannelId !== vcId)
            return interaction.reply({ content: "❌ You need to be in my voice channel.", flags: [MessageFlags.Ephemeral] });

        // Check if query is a selected autocomplete value
        let targetTrack: Track | undefined;
        const autoMatch = Number(query.replace("autocomplete_", ""));
        if (!isNaN(autoMatch) && autocompleteMap.has(`${interaction.user.id}_res`)) {
            const res = autocompleteMap.get(`${interaction.user.id}_res`) as SearchResult;
            targetTrack = res.tracks[autoMatch];
        }

        // If not from autocomplete, do normal search
        if (!targetTrack) {
            const response = await player.search({ query, source: src }, interaction.user) as SearchResult;
            if (!response?.tracks?.length)
                return interaction.reply({ content: "❌ No tracks found.", flags: [MessageFlags.Ephemeral] });

            targetTrack = response.tracks[0];
        }

        if (!targetTrack)
            return interaction.reply({ content: "❌ Track not found.", flags: [MessageFlags.Ephemeral] });

        // Skip current track
        if (player.queue.current) player.stopPlaying();

        // Play immediately
        await player.play({track: targetTrack});

        const embed = new EmbedBuilder()
            .setColor(0x1abc9c)
            .setTitle("⏭️ Now Playing (Skip)")
            .setDescription(`Playing [\`${targetTrack.info.title}\`](<${targetTrack.info.uri}>) by \`${targetTrack.info.author}\``)
            .addFields([
                { name: "Source", value: src.toUpperCase(), inline: true },
                { name: "Duration", value: formatMS_HHMMSS(targetTrack.info.duration), inline: true },
            ])
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    autocomplete: async (interaction, _client) => {
        if (!interaction.guildId) return;

        const vcId = (interaction.member as GuildMember)?.voice?.channelId;
        if (!vcId) return interaction.respond([{ name: "Join a voice channel", value: "join_vc" }]);

        const focussedQuery = interaction.options.getFocused();
        if (!focussedQuery.trim().length)
            return interaction.respond([{ name: "No tracks found (enter a query)", value: "nothing_found" }]);

        const src = (interaction.options as CommandInteractionOptionResolver).getString("source") as SearchPlatform;
        const player = lavalink.getPlayer(interaction.guildId) || lavalink.createPlayer({
            guildId: interaction.guildId,
            voiceChannelId: vcId,
            textChannelId: interaction.channelId,
            selfDeaf: true,
            selfMute: false,
            volume: defaultOptions.volume,
        });

        if (!player.connected) await player.connect();

        const res = await player.search({ query: focussedQuery, source: src }, interaction.user) as SearchResult;
        if (!res.tracks?.length)
            return interaction.respond([{ name: "No Tracks found", value: "nothing_found" }]);

        // store for autocomplete mapping
        if (autocompleteMap.has(`${interaction.user.id}_timeout`)) clearTimeout(autocompleteMap.get(`${interaction.user.id}_timeout`));
        autocompleteMap.set(`${interaction.user.id}_res`, res);
        autocompleteMap.set(`${interaction.user.id}_timeout`, setTimeout(() => {
            autocompleteMap.delete(`${interaction.user.id}_res`);
            autocompleteMap.delete(`${interaction.user.id}_timeout`);
        }, 25000));

        await interaction.respond(
            res.tracks.slice(0, 25).map((t: Track, i) => ({
                name: `[${formatMS_HHMMSS(t.info.duration)}] ${t.info.title.substring(0, 100)} (${t.info.author || "Unknown"})`,
                value: `autocomplete_${i}`
            }))
        );
    }
} as Command;
