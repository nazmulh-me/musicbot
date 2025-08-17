import type { SlashCommandBuilder, CommandInteraction, Client, AutocompleteInteraction } from "discord.js";

export type Event = {
    name: string,
    once: boolean,
    execute(...args: any[]): Promise<any>;
}
export type Command = {
    data: SlashCommandBuilder,
    execute(interaction: CommandInteraction, client: Client): Promise<void>;
    autocomplete?: (interaction: AutocompleteInteraction, client: Client) => Promise<void>;
}