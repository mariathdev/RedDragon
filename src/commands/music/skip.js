import { SlashCommandBuilder } from 'discord.js';
import * as pm from '../../music/playerManager.js';
import { successEmbed, warningEmbed } from '../../utils/embedBuilder.js';

export const data = new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip current song');

export async function execute(interaction) {
    const s = pm.get(interaction.guildId);
    const currentTrack = s?.player?.queue?.current ?? s?.player?.track ?? null;

    if (!s || !s.player || !currentTrack) {
        return interaction.reply({ embeds: [warningEmbed({ description: 'Nothing is playing right now.' })], ephemeral: true });
    }

    const skipped = currentTrack.info?.title ?? currentTrack.title ?? 'current song';
    await s.player.skip();

    return interaction.reply({ embeds: [successEmbed({ title: 'Skipped', description: `**${skipped}**` })] });
}
