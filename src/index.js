import { Client, GatewayIntentBits } from 'discord.js';
import { env } from './config/environment.js';
import { logger } from './utils/logger.js';
import { loadCommands } from './handlers/commandHandler.js';
import { loadEvents } from './handlers/eventHandler.js';
import { createLavalinkManager } from './music/playerManager.js';
import { registerRawVoiceBridge } from './bootstrap/rawVoiceBridge.js';
import { registerProcessLifecycle } from './bootstrap/processLifecycle.js';

try {
    await import('libsodium-wrappers');
    logger.info('Boot', 'Libsodium loaded successfully');
} catch {
    logger.warn('Boot', 'Libsodium not available, using fallback');
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
    ],
});

registerRawVoiceBridge(client);
registerProcessLifecycle(client);

async function boot() {
    logger.info('Boot', 'Starting Red Dragon Bot v2...');

    await loadCommands(client);
    await loadEvents(client);

    if (env.lavalink.host && env.lavalink.port && env.lavalink.password) {
        createLavalinkManager(client);
    } else {
        logger.warn('Boot', 'Lavalink env vars missing, music disabled');
    }

    await client.login(env.token);
}

boot().catch((err) => {
    logger.fatal('Boot', 'Failed to start bot', err);
    process.exit(1);
});
