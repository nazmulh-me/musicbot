import { MessageFlags, SlashCommandBuilder } from "discord.js";

import type { GuildMember, VoiceChannel } from "discord.js";
import type { Command } from "../types";
import { lavalink } from "../lavalink";
export default {
    data: new SlashCommandBuilder()
        .setName("reconnect_sync").setDescription("Reconnects to a Voice Channel if the Bot crashed, and syncs the queue!"),
    execute: async (interaction, client) => {
        if (!interaction.guildId) return;

        const vcId = (interaction.member as GuildMember)?.voice?.channelId;
        if (!vcId) return interaction.reply({ flags: [MessageFlags.Ephemeral], content: "Join a Voice Channel " });

        const vc = (interaction.member as GuildMember)?.voice?.channel as VoiceChannel;
        if (!vc.joinable || !vc.speakable) return interaction.reply({ flags: [MessageFlags.Ephemeral], content: "I am not able to join your channel / speak in there." });

        const player = lavalink.getPlayer(interaction.guildId);
        if (player?.voiceChannelId && player.connected) return interaction.reply({ flags: [MessageFlags.Ephemeral], content: "I'm already connected." })

        if (player) { // player already created, but not connected yet -> connect to it!
            player.voiceChannelId = player?.voiceChannelId || vcId;
            await player.connect();
        }

        const newPlayer = await lavalink.createPlayer({ // if it was existing before, but connected afterwards, it just re-gets the player of the cache
            guildId: interaction.guildId,
            voiceChannelId: vcId,
            textChannelId: interaction.channelId,
            selfDeaf: true,
            selfMute: false,
            // volume: client.defaultVolume,  // default volume
            instaUpdateFiltersFix: true, // optional
            applyVolumeAsFilter: false, // if true player.setVolume(54) -> player.filters.setVolume(0.54)
            // node: "YOUR_NODE_ID",
            // vcRegion: (interaction.member as GuildMember)?.voice.channel?.rtcRegion!
        });

        await newPlayer.connect();

        await newPlayer.queue.utils.sync(true, false);

        if (!newPlayer.queue.current && !newPlayer.queue.tracks.length) return await interaction.reply({ flags: [MessageFlags.Ephemeral], content: `No current Song could be synced, with no upcoming tracks` })

        await newPlayer.play();

        return await interaction.reply({
            content: `Joined your voiceChannel Synced`,
            flags: [MessageFlags.Ephemeral],
        });
    }
} as Command;