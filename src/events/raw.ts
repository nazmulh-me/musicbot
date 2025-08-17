import { REST, Routes, ActivityType, Client } from "discord.js";
import { commands } from "../..";
import { lavalink } from "../lavalink";

export default {
    name: "raw",
    async execute(d: any) {
        lavalink.sendRawData(d);
    },
};
