import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, warningEmbed } from '../../utils/embedBuilder.js';
import { getPlaybackState, getTrackTitle } from '../../music/commandSupport.js';

export const data = new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume paused song');

export async function execute(interaction) {
    const state = getPlaybackState(interaction.guildId);

    if (!state.player || !state.currentTrack || !state.player.paused) {
        return interaction.reply({ embeds: [warningEmbed({ description: 'Nothing is paused right now.' })], ephemeral: true });
    }

    await state.player.resume();

    return interaction.reply({ embeds: [successEmbed({ title: 'Resumed', description: `**${getTrackTitle(state.currentTrack)}**` })] });
}
