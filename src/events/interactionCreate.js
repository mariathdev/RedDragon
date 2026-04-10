import { logger } from '../utils/logger.js';
import { executeCommand } from '../utils/commandExecutor.js';

export const name = 'interactionCreate';
export const once = false;

export async function execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const cmd = interaction.client.commands.get(interaction.commandName);
    if (!cmd) {
        logger.warn('Interaction', `Unknown command: ${interaction.commandName}`);
        return;
    }

    await executeCommand({
        command: cmd,
        context: interaction,
        logContext: 'Interaction',
        actorTag: interaction.user.tag,
        invokedName: `/${interaction.commandName}`,
        location: interaction.guild?.name ?? 'DM',
    });
}
