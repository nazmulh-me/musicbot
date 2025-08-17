import { LavalinkManager } from "lavalink-client";
import { client } from "..";

export const lavalink = new LavalinkManager({
    nodes: [
        {
            authorization: "https://dsc.gg/ajidevserver",
            host: "lava-v4.ajieblogs.eu.org",
            port: 443,
            secure: true,
        },
        // {
        //     authorization: "https://dsc.gg/ajidevserver",
        //     host: "lavalinkv4.serenetia.com",
        //     port: 443,
        //     secure: true
        // },
        // //!Tested many but works this for now (ager gula kaaj kortesilona idk why:)
        // {
        //     authorization: "https://discord.gg/v6sdrD9kPh",
        //     host: "lavalink_v4.muzykant.xyz",
        //     port: 443,
        //     secure: true
        // },
        // {
        //     authorization: "DevamOP",
        //     host: "lavalink.devxcode.in",
        //     port: 443,
        //     secure: true
        // },
    ],
    sendToShard: (guildId, payload) =>
        client.guilds.cache.get(guildId)?.shard?.send(payload),
    autoSkip: true,
});

export const defaultOptions = {
    volume: 20,
};
