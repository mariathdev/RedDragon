import { SlashCommandBuilder } from 'discord.js';
import * as pm from '../../music/playerManager.js';
import { successEmbed, warningEmbed } from '../../utils/embedBuilder.js';
import { getPlaybackState } from '../../music/commandSupport.js';

export const data = new SlashCommandBuilder()
    .setName('disconnect')
    .setDescription('Disconnect bot from voice channel');

export async function execute(interaction) {
    const state = getPlaybackState(interaction.guildId);

    if (!state.player) {
        return interaction.reply({ embeds: [warningEmbed({ description: 'The bot is not in any voice channel.' })], ephemeral: true });
    }

    if (typeof state.player.setData === 'function') {
        state.player.setData('leaving', true);
    }

    await pm.destroy(interaction.guildId);

    return interaction.reply({ embeds: [successEmbed({ title: 'Disconnected', description: 'See you next time.' })] });
}
