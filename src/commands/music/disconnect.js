import { SlashCommandBuilder } from 'discord.js';
import * as pm from '../../music/playerManager.js';
import { successEmbed, warningEmbed } from '../../utils/embedBuilder.js';

export const data = new SlashCommandBuilder()
    .setName('disconnect')
    .setDescription('Disconnect bot from voice channel');

export async function execute(interaction) {
    const s = pm.get(interaction.guildId);

    if (!s || !s.player) {
        return interaction.reply({ embeds: [warningEmbed({ description: 'The bot is not in any voice channel.' })], ephemeral: true });
    }

    if (typeof s.player.setData === 'function') {
        s.player.setData('leaving', true);
    }

    await pm.destroy(interaction.guildId);

    return interaction.reply({ embeds: [successEmbed({ title: 'Disconnected', description: 'See you next time.' })] });
}
