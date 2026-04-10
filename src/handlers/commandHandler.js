import { Collection } from 'discord.js';
import path from 'path';
import { logger } from '../utils/logger.js';
import { collectJavaScriptFiles, importModule } from '../utils/moduleLoader.js';

export async function loadCommands(client) {
    client.commands = new Collection();
    const files = await collectJavaScriptFiles(path.resolve('src/commands'));

    for (const file of files) {
        try {
            const mod = await importModule(file);
            if (!mod.data || !mod.execute) {
                logger.warn('Commands', `${path.basename(file)} ignored: missing "data" or "execute"`);
                continue;
            }
            client.commands.set(mod.data.name, mod);
            logger.info('Commands', `Loaded: /${mod.data.name}`);
        } catch (err) {
            logger.error('Commands', `Error loading ${path.basename(file)}`, err);
        }
    }

    logger.info('Commands', `${client.commands.size} command(s) total`);
}
