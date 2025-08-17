import { MessageFlags, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { CommandInteractionOptionResolver, GuildMember } from "discord.js";
import type { Command } from "../types";
import { lavalink } from "../lavalink";

const loopModes = {
    track: { label: "Current Track", value: "track", emoji: "🔂", color: 0x1abc9c },
    queue: { label: "Entire Queue", value: "queue", emoji: "🔁", color: 0x3498db },
    off: { label: "Off", value: "off", emoji: "⏹", color: 0xe74c3c },
} as const;

export default {
    data: new SlashCommandBuilder()
        .setName("loop")
        .setDescription("Toggle loop mode for the current track or the whole queue")
        .addStringOption((o) =>
            o
                .setName("mode")
                .setDescription("Choose loop mode")
                .setRequired(true)
                .setChoices(
                    ...Object.values(loopModes).map((m) => ({ name: m.label, value: m.value }))
                )
        ),

    execute: async (interaction, _client) => {
        if (!interaction.guildId || !interaction.isChatInputCommand()) return;

        const member = interaction.member as GuildMember;
        const vcId = member?.voice?.channelId;

        const errorEmbed = (message: string) =>
            new EmbedBuilder()
                .setColor(0xe74c3c)
                .setDescription(`❌ ${message}`);

        if (!vcId)
            return interaction.reply({ embeds: [errorEmbed("You need to join a voice channel first.")], flags: [MessageFlags.Ephemeral] });

        const player = lavalink.getPlayer(interaction.guildId);
        if (!player?.queue?.current)
            return interaction.reply({ embeds: [errorEmbed("No music is currently playing. Try `/play` to start music.")] , flags: [MessageFlags.Ephemeral] });

        if (player.voiceChannelId !== vcId)
            return interaction.reply({ embeds: [errorEmbed("You must be in the same voice channel as me.")], flags: [MessageFlags.Ephemeral] });

        const mode = (interaction.options as CommandInteractionOptionResolver).getString("mode", true);
        const selectedMode = loopModes[mode as keyof typeof loopModes];
        if (!selectedMode)
            return interaction.reply({ embeds: [errorEmbed("Invalid loop mode.")], flags: [MessageFlags.Ephemeral] });

        // Already off check
        if (mode === "off" && player.repeatMode === "off") {
            return interaction.reply({ embeds: [errorEmbed("Looping is already turned off.")], flags: [MessageFlags.Ephemeral] });
        }

        // Prevent queue loop if empty
        if (mode === "queue" && player.queue.tracks.length === 0) {
            return interaction.reply({ embeds: [errorEmbed("Cannot loop the queue because there are no tracks in the queue.")], flags: [MessageFlags.Ephemeral] });
        }

        // Set loop mode
        player.setRepeatMode(selectedMode.value);

        const currentTrack = player.queue.current.info;

        // Success embed
        const embed = new EmbedBuilder()
            .setColor(selectedMode.color)
            .setTitle(`${selectedMode.emoji} Loop Mode Updated`)
            .setDescription(`The loop mode has been successfully updated.`)
            .addFields([
                { name: "🔹 Mode", value: `**${selectedMode.label}**`, inline: true },
                { name: "🎵 Now Playing", value: `${currentTrack.title}`, inline: true },
                { name: "🔊 Voice Channel", value: `<#${player.voiceChannelId}>`, inline: true },
                { name: "📜 Queue Length", value: `${player.queue.tracks.length} track(s)`, inline: true },
            ])
            .setFooter({ text: "Tip: Use /nowplaying to view the current track progress." })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
} as Command;
