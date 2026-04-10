import { SlashCommandBuilder } from 'discord.js';
import { parse } from '../../utils/diceParser.js';
import { createEmbed, warningEmbed, errorEmbed } from '../../utils/embedBuilder.js';
import { Colors } from '../../config/constants.js';
import {
    MAX_PARTICIPANTS,
    createInitiativeEntry,
    getSession,
    hasSession,
    registerInitiativeRoll,
    startSession,
} from '../../dice/initiativeSession.js';

export const data = new SlashCommandBuilder()
    .setName('initiative')
    .setDescription('Start an initiative tracker or roll your initiative')
    .addStringOption(o =>
        o.setName('expression')
         .setDescription('Dice expression with modifier (ex: d20+3, 1d20+5). Leave empty to start session.')
         .setRequired(false)
    );

export async function execute(interaction) {
    const expr = interaction.options.getString('expression');
    const channelId = interaction.channel.id;
    const userName = interaction.member?.displayName ?? interaction.user.username;

    if (!expr) {
        if (hasSession(channelId)) {
            return interaction.reply({
                embeds: [warningEmbed({ description: 'An initiative session is already active in this channel. Use `/end` to end it.' })],
                ephemeral: true,
            });
        }

        startSession(channelId, userName);

        const embed = createEmbed({
            color: Colors.FYRE_ORANGE,
            title: 'Initiative Tracker',
            description: `**${userName}** started an initiative session.\n\nEach player rolls with:\n\`/initiative d20+3\` or \`!initiative d20+5\`\n\nMax ${MAX_PARTICIPANTS} participants.\nUse \`/end\` or \`!end\` to close and display the turn order.`,
        });

        return interaction.reply({ embeds: [embed] });
    }

    const session = getSession(channelId);
    if (!session) {
        return interaction.reply({
            embeds: [warningEmbed({ description: 'No initiative session is active. Use `/initiative` without arguments to start one.' })],
            ephemeral: true,
        });
    }

    if (session.entries.length >= MAX_PARTICIPANTS) {
        return interaction.reply({
            embeds: [warningEmbed({ description: `Maximum of ${MAX_PARTICIPANTS} participants reached.` })],
            ephemeral: true,
        });
    }

    const result = parse(expr);
    if (result.error) {
        return interaction.reply({ embeds: [errorEmbed({ description: result.error })], ephemeral: true });
    }

    const registration = registerInitiativeRoll(channelId, createInitiativeEntry({
        userId: interaction.user.id,
        userName,
        result,
        expression: expr,
    }));

    if (!registration.ok) {
        const description = registration.reason === 'already_registered'
            ? `You already rolled: **${registration.entry.total}** (${registration.entry.expression}). Wait for the next session.`
            : `Maximum of ${MAX_PARTICIPANTS} participants reached.`;

        return interaction.reply({
            embeds: [warningEmbed({ description })],
            ephemeral: true,
        });
    }

    const rollDetail = result.type === 'modifier'
        ? `[${result.rolls.join(', ')}] ${result.sign} ${result.modifier} = **${result.total}**`
        : `[${result.rolls.join(', ')}] = **${result.total}**`;

    const embed = createEmbed({
        color: Colors.EMBERS_GOLD,
        title: 'Initiative Roll',
        description: `**${userName}** rolled initiative!\n${rollDetail}`,
        fields: [
            { name: 'Expression', value: `\`${expr}\``, inline: true },
            { name: 'Registered', value: `${registration.position}/${MAX_PARTICIPANTS}`, inline: true },
        ],
    });

    return interaction.reply({ embeds: [embed] });
}
