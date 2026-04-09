import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../utils/embedBuilder.js';
import { Colors } from '../config/constants.js';

export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('List all available commands');

export async function execute(interaction) {
    const fields = interaction.client.commands.map(cmd => ({
        name:   `/${cmd.data.name}`,
        value:  cmd.data.description || 'No description.',
        inline: false,
    }));

    const embed = createEmbed({
        title: 'Red Dragon -- Commands',
        description: 'Available slash commands in this server.',
        color: Colors.FYRE_ORANGE,
        fields,
    });

    await interaction.reply({ embeds: [embed] });
}
