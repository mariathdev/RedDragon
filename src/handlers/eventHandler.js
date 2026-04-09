import { readdir } from 'fs/promises';
import { pathToFileURL } from 'url';
import path from 'path';
import { logger } from '../utils/logger.js';

export async function loadEvents(client) {
    const dir = path.resolve('src/events');
    const files = (await readdir(dir)).filter(f => f.endsWith('.js'));

    for (const file of files) {
        const url = pathToFileURL(path.join(dir, file)).href;
        try {
            const mod = await import(url);
            if (!mod.name || !mod.execute) {
                logger.warn('Events', `${file} ignored: missing "name" or "execute"`);
                continue;
            }

            const method = mod.once ? 'once' : 'on';
            client[method](mod.name, (...args) => mod.execute(...args));
            logger.info('Events', `Registered: ${mod.name} (once: ${!!mod.once})`);
        } catch (err) {
            logger.error('Events', `Error loading ${file}`, err);
        }
    }
}
