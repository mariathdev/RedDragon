import { logger } from '../utils/logger.js';
import { handleInteractionError } from '../utils/errorHandler.js';

export const name = 'interactionCreate';
export const once = false;

export async function execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const cmd = interaction.client.commands.get(interaction.commandName);
    if (!cmd) {
        logger.warn('Interaction', `Unknown command: ${interaction.commandName}`);
        return;
    }

    const where = interaction.guild?.name ?? 'DM';
    logger.info('Interaction', `${interaction.user.tag} used /${interaction.commandName} in ${where}`);

    try {
        await cmd.execute(interaction);
    } catch (err) {
        await handleInteractionError(interaction, err);
    }
}
