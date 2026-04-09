import { SlashCommandBuilder } from 'discord.js';
import { parse } from '../../utils/diceParser.js';
import { createEmbed, warningEmbed, errorEmbed } from '../../utils/embedBuilder.js';
import { Colors } from '../../config/constants.js';

// Active initiative sessions keyed by channelId
const sessions = new Map();

const MAX_PARTICIPANTS = 12;

export const data = new SlashCommandBuilder()
    .setName('ini')
    .setDescription('Start an initiative tracker or roll your initiative')
    .addStringOption(o =>
        o.setName('expressao')
         .setDescription('Dice expression with modifier (ex: d20+3, 1d20+5). Leave empty to start session.')
         .setRequired(false)
    );

export async function execute(interaction) {
    const expr = interaction.options.getString('expressao');
    const channelId = interaction.channel.id;
    const userName = interaction.member?.displayName ?? interaction.user.username;

    // No expression: start a new session
    if (!expr) {
        if (sessions.has(channelId)) {
            return interaction.reply({
                embeds: [warningEmbed({ description: 'An initiative session is already active in this channel. Use `/fim` to end it.' })],
                ephemeral: true,
            });
        }

        sessions.set(channelId, { entries: [], startedBy: userName });

        const embed = createEmbed({
            color: Colors.FYRE_ORANGE,
            title: 'Initiative Tracker',
            description: `**${userName}** started an initiative session!\n\nEach player rolls their initiative:\n\`/ini d20+3\` or \`!ini d20+5\`\n\nMax ${MAX_PARTICIPANTS} participants.\nUse \`/fim\` or \`!fim\` to close and display the order.`,
        });

        return interaction.reply({ embeds: [embed] });
    }

    // Expression provided: roll and register
    const session = sessions.get(channelId);
    if (!session) {
        return interaction.reply({
            embeds: [warningEmbed({ description: 'No initiative session active. Use `/ini` without arguments to start one.' })],
            ephemeral: true,
        });
    }

    if (session.entries.length >= MAX_PARTICIPANTS) {
        return interaction.reply({
            embeds: [warningEmbed({ description: `Maximum of ${MAX_PARTICIPANTS} participants reached.` })],
            ephemeral: true,
        });
    }

    const existing = session.entries.find(e => e.userId === interaction.user.id);
    if (existing) {
        return interaction.reply({
            embeds: [warningEmbed({ description: `You already rolled: **${existing.total}** (${existing.expression}). Wait for the next session.` })],
            ephemeral: true,
        });
    }

    const result = parse(expr);
    if (result.error) {
        return interaction.reply({ embeds: [errorEmbed({ description: result.error })], ephemeral: true });
    }

    session.entries.push({
        userId: interaction.user.id,
        name: userName,
        total: result.total,
        expression: expr,
        rolls: result.rolls,
        type: result.type,
        modifier: result.type === 'modifier' ? `${result.sign}${result.modifier}` : null,
    });

    const position = session.entries.length;
    const rollDetail = result.type === 'modifier'
        ? `[${result.rolls.join(', ')}] ${result.sign} ${result.modifier} = **${result.total}**`
        : `[${result.rolls.join(', ')}] = **${result.total}**`;

    const embed = createEmbed({
        color: Colors.EMBERS_GOLD,
        title: 'Initiative Roll',
        description: `**${userName}** rolled initiative!\n${rollDetail}`,
        fields: [
            { name: 'Expression', value: `\`${expr}\``, inline: true },
            { name: 'Registered', value: `${position}/${MAX_PARTICIPANTS}`, inline: true },
        ],
    });

    return interaction.reply({ embeds: [embed] });
}

/**
 * Returns the sorted entries for a channel and clears the session.
 * Used by the /fim command.
 */
export function closeSession(channelId) {
    const session = sessions.get(channelId);
    if (!session) return null;

    sessions.delete(channelId);

    const sorted = [...session.entries].sort((a, b) => b.total - a.total);
    return { entries: sorted, startedBy: session.startedBy };
}
