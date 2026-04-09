import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../utils/embedBuilder.js';
import { Colors, Bot } from '../config/constants.js';

export const data = new SlashCommandBuilder()
    .setName('status')
    .setDescription('Display uptime, metrics, and bot state');

function formatUptime() {
    const s = Math.floor(process.uptime());
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m ${s % 60}s`;
}

function mb(bytes) {
    return (bytes / 1024 / 1024).toFixed(2);
}

export async function execute(interaction) {
    const { client } = interaction;
    const mem = process.memoryUsage();

    const embed = createEmbed({
        title: 'Red Dragon -- Status',
        description: 'Operational state of the dragon.',
        color: Colors.DRACO_GREEN,
        fields: [
            { name: 'Version',       value: `\`${Bot.VERSION}\``,                   inline: true },
            { name: 'Uptime',       value: `\`${formatUptime()}\``,                inline: true },
            { name: 'Latency',     value: `\`${client.ws.ping}ms\``,              inline: true },
            { name: 'Servers',   value: `\`${client.guilds.cache.size}\``,      inline: true },
            { name: 'Users',       value: `\`${client.users.cache.size}\``,       inline: true },
            { name: 'Channels',       value: `\`${client.channels.cache.size}\``,    inline: true },
            { name: 'Heap',         value: `\`${mb(mem.heapUsed)} MB\``,           inline: true },
            { name: 'RSS',          value: `\`${mb(mem.rss)} MB\``,                inline: true },
            { name: 'Node.js',      value: `\`${process.version}\``,               inline: true },
        ],
    });

    await interaction.reply({ embeds: [embed] });
}
