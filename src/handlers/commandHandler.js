import { Collection } from 'discord.js';
import { readdir } from 'fs/promises';
import { pathToFileURL } from 'url';
import path from 'path';
import { logger } from '../utils/logger.js';

async function collectFiles(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const files   = [];
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory())        files.push(...await collectFiles(full));
        else if (entry.name.endsWith('.js')) files.push(full);
    }
    return files;
}

export async function loadCommands(client) {
    client.commands = new Collection();
    const files = await collectFiles(path.resolve('src/commands'));

    for (const file of files) {
        const url = pathToFileURL(file).href;
        try {
            const mod = await import(url);
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
