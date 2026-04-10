import { logger } from '../utils/logger.js';
import { handleInteractionError } from '../utils/errorHandler.js';

export const name = 'interactionCreate';
export const once = false;

export async function execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
        logger.warn('Interaction', `Unknown command: ${interaction.commandName}`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (err) {
        await handleInteractionError(interaction, err);
    }
}
