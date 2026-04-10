import { ActivityType } from 'discord.js';
import { logger } from '../utils/logger.js';
import { Bot } from '../config/constants.js';
import { startHealthLoop } from '../loops/healthCheck.js';
import { initLavalink } from '../music/playerManager.js';

export const name = 'clientReady';
export const once = true;

export async function execute(client) {
    client.user.setPresence({
        status: 'online',
        activities: [{
            name: `v${Bot.VERSION} | /help`,
            type: ActivityType.Watching,
        }],
    });

    if (client.lavalink) {
        try {
            await initLavalink();
        } catch (err) {
            logger.warn('Lavalink', 'Could not connect to Lavalink node. Music may not work.', err);
        }
    }

    startHealthLoop(client);
    logger.info('Ready', `${client.user.tag} online | ${client.guilds.cache.size} server(s) | ${client.commands.size} command(s)`);
}
