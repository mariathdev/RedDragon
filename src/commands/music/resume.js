import { SlashCommandBuilder } from 'discord.js';
import * as pm from '../../music/playerManager.js';
import { successEmbed, warningEmbed } from '../../utils/embedBuilder.js';

export const data = new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume paused song');

export async function execute(interaction) {
    const s = pm.get(interaction.guildId);
    const currentTrack = s?.player?.queue?.current ?? s?.player?.track ?? null;

    if (!s || !s.player || !currentTrack || !s.player.paused) {
        return interaction.reply({ embeds: [warningEmbed({ description: 'Nothing is paused right now.' })], ephemeral: true });
    }

    await s.player.resume();
    const title = currentTrack.info?.title ?? currentTrack.title ?? 'current song';

    return interaction.reply({ embeds: [successEmbed({ title: 'Resumed', description: `**${title}**` })] });
}
