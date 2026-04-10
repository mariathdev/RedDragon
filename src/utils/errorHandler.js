import { logger } from './logger.js';
import { errorEmbed } from './embedBuilder.js';

export async function handleInteractionError(interaction, err) {
    const commandLabel = interaction.commandName ? `/${interaction.commandName}` : 'command';
    logger.error('Interaction', `Failed on ${commandLabel}`, err);

    const embed = errorEmbed({
        title: 'Command Failed',
        description: 'Something went wrong processing your request.',
    });

    try {
        if (interaction.deferred && typeof interaction.editReply === 'function') {
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        const method = interaction.replied ? 'followUp' : 'reply';
        await interaction[method]({ embeds: [embed], ephemeral: true });
    } catch (replyErr) {
        logger.error('Interaction', 'Could not send error response', replyErr);
    }
}
