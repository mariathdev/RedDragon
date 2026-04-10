import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, warningEmbed } from '../../utils/embedBuilder.js';
import { getPlaybackState, getTrackTitle } from '../../music/commandSupport.js';

export const data = new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause current song');

export async function execute(interaction) {
    const state = getPlaybackState(interaction.guildId);

    if (!state.player || !state.currentTrack || state.player.paused) {
        return interaction.reply({ embeds: [warningEmbed({ description: 'Nothing is playing right now.' })], ephemeral: true });
    }

    await state.player.pause();

    return interaction.reply({ embeds: [successEmbed({ title: 'Paused', description: `**${getTrackTitle(state.currentTrack)}**` })] });
}
