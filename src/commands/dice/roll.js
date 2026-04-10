import { SlashCommandBuilder } from 'discord.js';
import { parse } from '../../utils/diceParser.js';
import { createEmbed, errorEmbed } from '../../utils/embedBuilder.js';
import { Colors } from '../../config/constants.js';
import { buildRollPresentation } from '../../dice/rollPresentation.js';
import { createInitiativeEntry, registerInitiativeRoll } from '../../dice/initiativeSession.js';

export const data = new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll RPG dice')
    .addStringOption(o =>
        o.setName('expression')
         .setDescription('Ex: d20  2d6  1d20+5  4d6dl1  5#1d20')
         .setRequired(true)
    );

export async function execute(interaction) {
    const expr = interaction.options.getString('expression');
    if (!expr) {
        return interaction.reply({
            embeds: [errorEmbed({ description: 'Provide a dice expression. Example: `d20+5`.' })],
            ephemeral: true,
        });
    }

    await interaction.deferReply();
    const result = parse(expr);

    if (result.error) {
        return interaction.editReply({ embeds: [errorEmbed({ description: result.error })] });
    }

    const { title, description, gif } = await buildRollPresentation(result);

    const embed = createEmbed({
        color:       Colors.EMBERS_GOLD,
        title,
        description,
        fields:      [{ name: 'Expression', value: `\`${expr}\``, inline: true }],
    });

    if (gif) embed.setImage(gif);

    if (result.type !== 'multi') {
        const userName = interaction.member?.displayName ?? interaction.user?.username ?? 'Unknown';
        const registration = registerInitiativeRoll(interaction.channel.id, createInitiativeEntry({
            userId: interaction.user.id,
            userName,
            result,
            expression: expr,
        }));

        if (registration.ok) {
            embed.addFields({ name: 'Initiative', value: `Registered as **${result.total}**`, inline: true });
        }
    }

    return interaction.editReply({ embeds: [embed] });
}
