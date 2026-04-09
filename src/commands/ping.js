import { SlashCommandBuilder } from 'discord.js';
import { successEmbed } from '../utils/embedBuilder.js';

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check latency and response time');

export async function execute(interaction) {
    const t0 = Date.now();
    await interaction.deferReply();
    const roundTrip = Date.now() - t0;

    const embed = successEmbed({
        title: 'Pong!',
        description: 'The dragon is awake and breathing fire.',
        fields: [
            { name: 'Round Trip', value: `\`${roundTrip}ms\``, inline: true },
            { name: 'WebSocket',   value: `\`${interaction.client.ws.ping}ms\``, inline: true },
        ],
    });

    await interaction.editReply({ embeds: [embed] });
}
