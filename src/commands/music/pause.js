import { SlashCommandBuilder } from 'discord.js';
import * as pm from '../../music/playerManager.js';
import { successEmbed, warningEmbed } from '../../utils/embedBuilder.js';

export const data = new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause current song');

export async function execute(interaction) {
    const s = pm.get(interaction.guildId);
    const currentTrack = s?.player?.queue?.current ?? s?.player?.track ?? null;

    if (!s || !s.player || !currentTrack || s.player.paused) {
        return interaction.reply({ embeds: [warningEmbed({ description: 'Nothing is playing right now.' })], ephemeral: true });
    }

    await s.player.pause();
    const title = currentTrack.info?.title ?? currentTrack.title ?? 'current song';

    return interaction.reply({ embeds: [successEmbed({ title: 'Paused', description: `**${title}**` })] });
}
