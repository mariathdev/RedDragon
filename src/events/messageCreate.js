import { createContext } from '../utils/messageContext.js';
import { executeCommand } from '../utils/commandExecutor.js';

const PREFIX = '!';

const ALIASES = {
    endinitiative: 'end',
    initiativeend: 'end',
};

export const name = 'messageCreate';

export async function execute(message) {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const [rawName, ...args] = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = rawName?.toLowerCase();
    if (!commandName) return;

    const slashName = ALIASES[commandName] ?? commandName;
    const cmd       = message.client.commands.get(slashName);
    if (!cmd) return;

    const ctx = createContext(message, slashName, args);
    await executeCommand({
        command: cmd,
        context: ctx,
        logContext: 'Prefix',
        actorTag: message.author.tag,
        invokedName: `!${commandName}`,
        location: message.guild?.name ?? 'DM',
    });
}
