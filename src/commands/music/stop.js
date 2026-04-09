import { SlashCommandBuilder } from 'discord.js';
import * as pm from '../../music/playerManager.js';
import { successEmbed, warningEmbed } from '../../utils/embedBuilder.js';

export const data = new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop music and clear queue');

export async function execute(interaction) {
    const s = pm.get(interaction.guildId);
    const currentTrack = s?.player?.queue?.current ?? s?.player?.track ?? null;

    if (!s || !s.player || (!currentTrack && s.player.queue.tracks.length === 0)) {
        return interaction.reply({ embeds: [warningEmbed({ description: 'Nothing is playing right now.' })], ephemeral: true });
    }

    await s.player.stopPlaying(true);

    return interaction.reply({ embeds: [successEmbed({ title: 'Stopped', description: 'Queue cleared and playback ended.' })] });
}
