import { SlashCommandBuilder } from 'discord.js';
import { closeSession } from './ini.js';
import { createEmbed, warningEmbed } from '../../utils/embedBuilder.js';
import { Colors } from '../../config/constants.js';

export const data = new SlashCommandBuilder()
    .setName('fim')
    .setDescription('End the initiative session and display the turn order');

export async function execute(interaction) {
    const result = closeSession(interaction.channel.id);

    if (!result) {
        return interaction.reply({
            embeds: [warningEmbed({ description: 'No active initiative session in this channel.' })],
            ephemeral: true,
        });
    }

    if (!result.entries.length) {
        const embed = createEmbed({
            color: Colors.FYRE_ORANGE,
            title: 'Initiative -- Closed',
            description: 'Session ended with no participants.',
        });
        return interaction.reply({ embeds: [embed] });
    }

    const lines = result.entries.map((e, i) => {
        const medal = i === 0 ? ' [1st]' : '';
        const detail = e.modifier ? `(${e.modifier})` : '';
        return `**${i + 1}.** ${e.name} -- **${e.total}** ${detail}${medal}`;
    });

    const embed = createEmbed({
        color: Colors.DRACO_GREEN,
        title: 'Initiative -- Turn Order',
        description: lines.join('\n'),
        fields: [
            { name: 'Participants', value: String(result.entries.length), inline: true },
            { name: 'Started by', value: result.startedBy, inline: true },
        ],
    });

    return interaction.reply({ embeds: [embed] });
}
