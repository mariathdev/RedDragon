import { logger } from './logger.js';
import { errorEmbed } from './embedBuilder.js';

export async function handleInteractionError(interaction, err) {
    logger.error('Interaction', `Failed on /${interaction.commandName}`, err);

    const embed = errorEmbed({
        title: 'Command Failed',
        description: 'Something went wrong processing your request.',
    });

    try {
        const method = (interaction.replied || interaction.deferred) ? 'followUp' : 'reply';
        await interaction[method]({ embeds: [embed], ephemeral: true });
    } catch (replyErr) {
        logger.error('Interaction', 'Could not send error response', replyErr);
    }
}
