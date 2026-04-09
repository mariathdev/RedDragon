import { SlashCommandBuilder } from 'discord.js';
import { parse } from '../../utils/diceParser.js';
import { fetchGif } from '../../utils/gifProvider.js';
import { createEmbed, errorEmbed } from '../../utils/embedBuilder.js';
import { Colors } from '../../config/constants.js';

export const data = new SlashCommandBuilder()
    .setName('rolar')
    .setDescription('Roll RPG dice')
    .addStringOption(o =>
        o.setName('expressao')
         .setDescription('Ex: d20  2d6  1d20+5  4d6dl1  5#1d20')
         .setRequired(true)
    );

function fmt(rolls, droppedIdx = new Set()) {
    return rolls.map((v, i) => droppedIdx.has(i) ? `~~${v}~~` : String(v)).join(', ');
}

export async function execute(interaction) {
    await interaction.deferReply();

    const expr   = interaction.options.getString('expressao');
    const result = parse(expr);

    if (result.error) {
        return interaction.editReply({ embeds: [errorEmbed({ description: result.error })] });
    }

    let title = 'RedDragon Dice';
    let description = '';
    let gif         = null;

    if (result.type === 'simple') {
        const isFail = result.rolls.includes(1);
        const isCrit = result.rolls.includes(result.sides);
        description  = `[${fmt(result.rolls)}] = **${result.total}**`;
        if (isFail) {
            title = 'EPIC FAIL';
            gif = await fetchGif('anime fail');
        } else if (isCrit) {
            title = 'EPIC SUCCESS';
            gif = await fetchGif('anime power');
        }
    }

    if (result.type === 'modifier') {
        const isFail = result.rolls.includes(1);
        const isCrit = result.rolls.includes(result.sides);
        description  = `[${fmt(result.rolls)}] ${result.sign} ${result.modifier} = **${result.total}**`;
        if (isFail) {
            title = 'EPIC FAIL';
            gif = await fetchGif('anime fail');
        } else if (isCrit) {
            title = 'EPIC SUCCESS';
            gif = await fetchGif('anime power');
        }
    }

    if (result.type === 'drop') {
        const isFail = result.rolls.includes(1);
        const isCrit = result.rolls.includes(result.sides);
        const detail = `[${fmt(result.rolls, result.droppedIdx)}]`;
        description  = `${detail} = **${result.total}**\n-# ${result.drop} menor(es) removido(s)`;
        if (isFail) {
            title = 'EPIC FAIL';
            gif = await fetchGif('anime fail');
        } else if (isCrit) {
            title = 'EPIC SUCCESS';
            gif = await fetchGif('anime power');
        }
    }

    if (result.type === 'multi') {
        description = result.results
            .map((r, i) => `${i + 1}. [${fmt(r.rolls)}] = **${r.total}**`)
            .join('\n');
    }

    const embed = createEmbed({
        color:       Colors.EMBERS_GOLD,
        title,
        description,
        fields:      [{ name: 'Expressao', value: `\`${expr}\``, inline: true }],
    });

    if (gif) embed.setImage(gif);

    return interaction.editReply({ embeds: [embed] });
}
