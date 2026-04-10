import { createContext } from '../utils/messageContext.js';
import { handleInteractionError } from '../utils/errorHandler.js';

const PREFIX = '!';
const ALIASES = {
    endinitiative: 'end',
    initiativeend: 'end',
};

export const name = 'messageCreate';

export async function execute(message) {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const [rawName, ...args] = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = rawName?.toLowerCase();
    if (!commandName) return;

    const command = message.client.commands.get(ALIASES[commandName] ?? commandName);
    if (!command) return;
    const context = createContext(message, command.data.name, args);

    try {
        await command.execute(context);
    } catch (err) {
        await handleInteractionError(context, err);
    }
}
