import path from 'path';
import { logger } from '../utils/logger.js';
import { collectJavaScriptFiles, importModule } from '../utils/moduleLoader.js';

export async function loadEvents(client) {
    const dir = path.resolve('src/events');
    const files = await collectJavaScriptFiles(dir);
    let loaded = 0;
    let skipped = 0;

    for (const file of files) {
        try {
            const mod = await importModule(file);
            if (!mod.name || !mod.execute) {
                logger.warn('Events', `${path.basename(file)} ignored: missing "name" or "execute"`);
                skipped++;
                continue;
            }

            const method = mod.once ? 'once' : 'on';
            client[method](mod.name, (...args) => mod.execute(...args));
            loaded++;
        } catch (err) {
            logger.error('Events', `Error loading ${path.basename(file)}`, err);
        }
    }

    logger.info('Events', `${loaded} registered${skipped ? `, ${skipped} skipped` : ''}`);
}
