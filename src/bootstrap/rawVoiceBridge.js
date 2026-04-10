import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';

const VOICE_EVENTS = new Set(['VOICE_STATE_UPDATE', 'VOICE_SERVER_UPDATE']);
const VOICE_STATE_TTL_MS = 15_000;

export function registerRawVoiceBridge(client) {
    const lastBotVoiceStates = new Map();
    const pendingVoiceServers = new Map();

    function getBotUserId() {
        return client.user?.id ?? env.clientId ?? null;
    }

    async function forward(packet) {
        await client.lavalink.sendRawData(packet);
    }

    async function handleVoiceStateUpdate(packet, botUserId) {
        const data = packet.d;

        if (data.user_id !== botUserId) {
            await forward(packet);
            return;
        }

        if (!data.channel_id) {
            lastBotVoiceStates.delete(data.guild_id);
            pendingVoiceServers.delete(data.guild_id);
            await forward(packet);
            return;
        }

        lastBotVoiceStates.set(data.guild_id, {
            packet,
            seenAt: Date.now(),
        });

        await forward(packet);

        const pendingServer = pendingVoiceServers.get(data.guild_id);
        if (!pendingServer) {
            return;
        }

        pendingVoiceServers.delete(data.guild_id);
        await forward(pendingServer);
    }

    async function handleVoiceServerUpdate(packet) {
        const data = packet.d;
        const lastStateEntry = lastBotVoiceStates.get(data.guild_id);
        const lastState = lastStateEntry?.packet;
        const isFreshState = lastStateEntry && (Date.now() - lastStateEntry.seenAt) <= VOICE_STATE_TTL_MS;

        if (!isFreshState || !lastState?.d?.session_id || !lastState?.d?.channel_id) {
            pendingVoiceServers.set(data.guild_id, packet);
            return;
        }

        await forward(lastState);
        await forward(packet);
    }

    async function handleRawPacket(packet) {
        if (!client.lavalink || !packet?.t) {
            return;
        }

        if (!VOICE_EVENTS.has(packet.t)) {
            await forward(packet);
            return;
        }

        if (!packet.d?.guild_id) {
            await forward(packet);
            return;
        }

        if (packet.t === 'VOICE_STATE_UPDATE') {
            await handleVoiceStateUpdate(packet, getBotUserId());
            return;
        }

        await handleVoiceServerUpdate(packet);
    }

    client.on('raw', (packet) => {
        handleRawPacket(packet).catch((err) => {
            logger.error('Lavalink', `Failed to process raw packet ${packet?.t ?? 'UNKNOWN'}`, err);
        });
    });
}
