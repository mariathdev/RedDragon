import { Client, GatewayIntentBits } from 'discord.js';
import { env } from './config/environment.js';
import { logger } from './utils/logger.js';
import { loadCommands } from './handlers/commandHandler.js';
import { loadEvents } from './handlers/eventHandler.js';
import { createLavalinkManager } from './music/playerManager.js';

try {
    await import('libsodium-wrappers');
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

// Buffer VOICE_SERVER_UPDATE when it arrives before VOICE_STATE_UPDATE.
// lavalink-client needs sessionId (from STATE) before processing SERVER.
const pendingVoiceServers = new Map();

const VOICE_EVENTS = new Set(['VOICE_STATE_UPDATE', 'VOICE_SERVER_UPDATE', 'CHANNEL_DELETE']);

client.on('raw', (packet) => {
    if (!client.lavalink || !packet?.t || !VOICE_EVENTS.has(packet.t)) return;

    if (packet.t === 'VOICE_STATE_UPDATE') {
        client.lavalink.sendRawData(packet);

        // If a VOICE_SERVER_UPDATE was buffered for this guild, replay it now
        const guildId = packet.d?.guild_id;
        const botId = client.user?.id ?? env.clientId;
        if (guildId && packet.d?.user_id === botId && packet.d?.channel_id) {
            const pending = pendingVoiceServers.get(guildId);
            if (pending) {
                pendingVoiceServers.delete(guildId);
                client.lavalink.sendRawData(pending);
            }
        }
        return;
    }

    if (packet.t === 'VOICE_SERVER_UPDATE') {
        const guildId = packet.d?.guild_id;
        if (!guildId) return;

        const player = client.lavalink.getPlayer(guildId);
        if (player?.voice?.sessionId) {
            client.lavalink.sendRawData(packet);
        } else {
            pendingVoiceServers.set(guildId, packet);
        }
        return;
    }

    // CHANNEL_DELETE
    client.lavalink.sendRawData(packet);
});

process.on('unhandledRejection', (err) => {
    logger.fatal('Process', 'Unhandled promise rejection', err);
});

process.on('uncaughtException', (err) => {
    logger.fatal('Process', 'Uncaught exception', err);
    process.exit(1);
});

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

boot().catch((err) => {
    logger.fatal('Boot', 'Failed to start bot', err);
    process.exit(1);
});

async function boot() {
    logger.info('Boot', 'Starting Red Dragon Bot v2...');

    await loadCommands(client);
    await loadEvents(client);

    if (env.lavalink.host && env.lavalink.port) {
        createLavalinkManager(client);
    } else {
        logger.warn('Boot', 'Lavalink env vars missing, music disabled');
    }

    await client.login(env.token);
}

function shutdown(signal) {
    logger.info('Process', `Received ${signal}, shutting down...`);
    client.destroy();
    process.exit(0);
}
