import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, warningEmbed } from '../../utils/embedBuilder.js';
import { getPlaybackState } from '../../music/commandSupport.js';

export const data = new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop music and clear queue');

export async function execute(interaction) {
    const state = getPlaybackState(interaction.guildId);

    if (!state.player || (!state.currentTrack && state.player.queue.tracks.length === 0)) {
        return interaction.reply({ embeds: [warningEmbed({ description: 'Nothing is playing right now.' })], ephemeral: true });
    }

    await state.player.stopPlaying(true);

    return interaction.reply({ embeds: [successEmbed({ title: 'Stopped', description: 'Queue cleared and playback ended.' })] });
}
