import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, warningEmbed } from '../../utils/embedBuilder.js';
import { getPlaybackState, getTrackTitle } from '../../music/commandSupport.js';

export const data = new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip current song');

export async function execute(interaction) {
    const state = getPlaybackState(interaction.guildId);

    if (!state.player || !state.currentTrack) {
        return interaction.reply({ embeds: [warningEmbed({ description: 'Nothing is playing right now.' })], ephemeral: true });
    }

    const skipped = getTrackTitle(state.currentTrack);
    await state.player.skip();

    return interaction.reply({ embeds: [successEmbed({ title: 'Skipped', description: `**${skipped}**` })] });
}
