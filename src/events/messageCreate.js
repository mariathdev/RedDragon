import { createContext } from '../utils/messageContext.js';
import { handleInteractionError } from '../utils/errorHandler.js';
import { logger } from '../utils/logger.js';

const PREFIX = '!';

const ALIASES = {
    roll:       'rolar',
    ini:        'ini',
    fim:        'fim',
    play:       'play',
    pause:      'pause',
    resume:     'resume',
    skip:       'skip',
    stop:       'stop',
    queue:      'queue',
    disconnect: 'disconnect',
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

    const where = message.guild?.name ?? 'DM';
    logger.info('Prefix', `${message.author.tag} used !${commandName} in ${where}`);

    const ctx = createContext(message, slashName, args);

    try {
        await cmd.execute(ctx);
    } catch (err) {
        await handleInteractionError(ctx, err);
    }
}
