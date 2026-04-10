import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, warningEmbed } from '../utils/embedBuilder.js';
import { getPlaybackState } from './playerManager.js';

export function createControlCommand({ name, description, getWarning, run }) {
    return {
        data: new SlashCommandBuilder()
            .setName(name)
            .setDescription(description),

        async execute(interaction) {
            const state = getPlaybackState(interaction.guildId);
            const warning = getWarning(state, interaction);

            if (warning) {
                return interaction.reply({
                    embeds: [warningEmbed({ description: warning })],
                    ephemeral: true,
                });
            }

            return interaction.reply({
                embeds: [successEmbed(await run(state, interaction))],
            });
        },
    };
}
