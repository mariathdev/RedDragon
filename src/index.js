import { Client, GatewayIntentBits } from 'discord.js';
import { env } from './config/environment.js';
import { logger } from './utils/logger.js';
import { loadCommands } from './handlers/commandHandler.js';
import { loadEvents } from './handlers/eventHandler.js';
import { createLavalinkManager } from './music/playerManager.js';

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
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
    ],
});

// -------------------------------------------------------------------
// CRITICAL FIX: Register the raw packet forwarder BEFORE client.login
// so that VOICE_STATE_UPDATE and VOICE_SERVER_UPDATE are never missed
// during the initial voice handshake. Without this, Lavalink never
// receives voice server confirmation and Discord drops the audio
// stream after ~1 second.
// -------------------------------------------------------------------
client.on('raw', (packet) => {
    if (!client.lavalink) return;
    client.lavalink.sendRawData(packet);
});

async function boot() {
    logger.info('Boot', 'Starting Red Dragon Bot v2...');

    await loadCommands(client);
    await loadEvents(client);

    // Pre-create the LavalinkManager so the raw forwarder above has
    // a valid sendRawData target as soon as voice packets arrive.
    // The actual TCP connection to the Lavalink node happens later
    // in the ready event (requires client.user.id).
    if (env.lavalink.host && env.lavalink.port && env.lavalink.password) {
        createLavalinkManager(client);
    } else {
        logger.warn('Boot', 'Lavalink env vars missing, music disabled');
    }

    await client.login(env.token);
}

process.on('unhandledRejection', (err) => {
    logger.fatal('Process', 'Unhandled promise rejection', err);
});

process.on('uncaughtException', (err) => {
    logger.fatal('Process', 'Uncaught exception', err);
    process.exit(1);
});

function shutdown(signal) {
    logger.info('Process', `Received ${signal}, shutting down...`);
    client.destroy();
    process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

boot().catch((err) => {
    logger.fatal('Boot', 'Failed to start bot', err);
    process.exit(1);
});
