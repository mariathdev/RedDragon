import net from 'node:net';
import { LavalinkManager } from 'lavalink-client';
import { logger } from '../utils/logger.js';
import { createEmbed } from '../utils/embedBuilder.js';
import { Colors, Music } from '../config/constants.js';
import { env } from '../config/environment.js';

let client = null;

// -- Internal helpers -----------------------------------------------

function probeLavalink(host, port, timeoutMs = 2500) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let settled = false;

        const finish = (ok) => {
            if (settled) return;
            settled = true;
            socket.destroy();
            resolve(ok);
        };

        socket.setTimeout(timeoutMs);
        socket.once('connect', () => finish(true));
        socket.once('timeout', () => finish(false));
        socket.once('error', () => finish(false));
        socket.connect(port, host);
    });
}

function registerLavalinkEvents(lavalink) {
    // Node lifecycle
    lavalink.nodeManager.on('connect', (node) => {
        logger.info('Lavalink', `Node connected: ${node.id}`);
    });

    lavalink.nodeManager.on('disconnect', (node) => {
        logger.warn('Lavalink', `Node disconnected: ${node.id}`);
    });

    lavalink.nodeManager.on('error', (node, err) => {
        logger.error('Lavalink', `Error on node ${node.id}`, err);
    });

    lavalink.nodeManager.on('reconnecting', (node) => {
        logger.info('Lavalink', `Reconnecting to node: ${node.id}`);
    });

    // Track lifecycle
    lavalink.on('trackStart', (player, track) => {
        logger.info('Lavalink', `trackStart: "${track.info?.title}" in guild ${player.guildId}`);
        const channel = player.textChannelId
            ? client.channels.cache.get(player.textChannelId)
            : null;
        if (!channel) return;

        const embed = createEmbed({
            color: Colors.DRACO_GREEN,
            title: 'Now Playing',
            description: `**${track.info.title}**`,
            fields: [
                { name: 'Requested by', value: String(track.requester ?? 'Unknown'), inline: true },
            ],
        });

        channel.send({ embeds: [embed] }).catch(() => {});
    });

    lavalink.on('trackEnd', (player, track, payload) => {
        logger.info('Lavalink', `Track ended: "${track.info?.title}" (reason: ${payload?.reason})`);
    });

    lavalink.on('trackError', (player, track, payload) => {
        const msg = payload?.exception?.message ?? payload?.error ?? JSON.stringify(payload);
        logger.error('Lavalink', `Track error on "${track.info?.title}": ${msg}`);

        const channel = player.textChannelId
            ? client.channels.cache.get(player.textChannelId)
            : null;
        if (channel) {
            const embed = createEmbed({
                color: Colors.DRAGON_BLOOD,
                title: 'Playback Error',
                description: `Could not play **${track.info?.title ?? 'track'}**.\n\`${msg}\``,
            });
            channel.send({ embeds: [embed] }).catch(() => {});
        }
    });

    lavalink.on('trackStuck', (player, track, payload) => {
        logger.warn('Lavalink', `Track stuck: "${track.info?.title}" (threshold: ${payload?.thresholdMs}ms) -- skipping`);
        player.skip().catch(() => {});
    });

    lavalink.on('queueEnd', (player) => {
        logger.info('Lavalink', `Queue ended for guild ${player.guildId}`);
    });

    // Player lifecycle (debug)
    lavalink.on('playerCreate', (player) => {
        logger.info('Lavalink', `Player created for guild ${player.guildId}`);
    });

    lavalink.on('playerDestroy', (_player, reason) => {
        logger.info('Lavalink', `Player destroyed: ${reason}`);
    });
}

// -- Public API -----------------------------------------------------

/**
 * Creates the LavalinkManager and attaches it to client.lavalink.
 * Called BEFORE client.login() so the raw event forwarder in index.js
 * can deliver VOICE_STATE_UPDATE / VOICE_SERVER_UPDATE packets
 * immediately. Does NOT connect to the Lavalink node yet.
 */
export function createLavalinkManager(botClient) {
    client = botClient;

    const lavalink = new LavalinkManager({
        nodes: [
            {
                host: env.lavalink.host,
                port: env.lavalink.port,
                authorization: env.lavalink.password,
                id: env.lavalink.nodeId,
                secure: env.lavalink.secure,
            },
        ],
        sendToShard: (guildId, payload) => {
            client.guilds.cache.get(guildId)?.shard?.send(payload);
        },
        client: {
            id: env.clientId,
        },
        autoSkip: true,
        playerOptions: {
            defaultSearchPlatform: env.lavalink.defaultSearchPlatform,
            useUnresolvedData: true,
            applyVolumeAsFilter: false,
            onDisconnect: {
                autoReconnect: true,
                destroyPlayer: false,
            },
            onEmptyQueue: {
                destroyAfterMs: 30_000,
            },
        },
        queueOptions: {
            maxPreviousTracks: 10,
        },
    });

    registerLavalinkEvents(lavalink);
    client.lavalink = lavalink;

    logger.info('Lavalink', 'LavalinkManager created (awaiting node connection)');
    return lavalink;
}

/**
 * Connects to the Lavalink node. Called from the ready event
 * once client.user is available.
 */
export async function initLavalink() {
    if (!client?.lavalink) {
        throw new Error('LavalinkManager not created. Call createLavalinkManager first.');
    }

    const isReachable = await probeLavalink(env.lavalink.host, env.lavalink.port);
    if (!isReachable) {
        throw new Error(`Lavalink unreachable at ${env.lavalink.host}:${env.lavalink.port}`);
    }

    await client.lavalink.init({
        id: client.user.id,
        username: client.user.username,
    });

    return client.lavalink;
}

/**
 * Ensures the Lavalink node is connected and usable.
 * Attempts reconnection if the node went down.
 */
export async function ensureLavalinkReady() {
    if (!client?.lavalink) {
        throw new Error('Lavalink not initialized. Music is unavailable.');
    }

    if (client.lavalink.useable) {
        return client.lavalink;
    }

    try {
        await client.lavalink.nodeManager.connectAll();
    } catch (err) {
        logger.warn('Lavalink', 'Reconnect attempt failed', err);
    }

    if (!client.lavalink.useable) {
        throw new Error(`Lavalink server is offline at ${env.lavalink.host}:${env.lavalink.port}.`);
    }

    return client.lavalink;
}

/**
 * Returns the player and its text channel for a guild, or null.
 */
export function get(guildId) {
    const lavalink = client?.lavalink;
    if (!lavalink) return null;
    const player = lavalink.getPlayer(guildId);
    if (!player) return null;
    return {
        player,
        textChannel: player.textChannelId
            ? client.channels.cache.get(player.textChannelId)
            : null,
    };
}

/**
 * Connects to a voice channel and returns the player instance.
 */
export async function connect(guildId, voiceChannel, textChannel) {
    const lavalink = await ensureLavalinkReady();
    let player = lavalink.getPlayer(guildId);

    if (!player) {
        player = lavalink.createPlayer({
            guildId,
            voiceChannelId: voiceChannel.id,
            textChannelId: textChannel.id,
            selfDeaf: true,
            selfMute: false,
        });
    }

    if (!player.connected) {
        await player.connect();
    }

    if (textChannel?.id) {
        player.textChannelId = textChannel.id;
    }

    return player;
}

/**
 * Adds a track to the queue and starts playback if idle.
 */
export async function enqueue(guildId, track) {
    const s = get(guildId);
    if (!s) throw new Error('Player not initialized.');

    const queueSize = s.player.queue.tracks.length;
    if (queueSize >= Music.MAX_QUEUE) {
        return { error: `Queue full (max: ${Music.MAX_QUEUE} songs).` };
    }

    await s.player.queue.add(track);
    if (!s.player.playing) {
        await s.player.play();
    }

    return null;
}

/**
 * Searches for tracks using the player's search method.
 */
export async function resolve(guildId, query, requester) {
    await ensureLavalinkReady();
    const s = get(guildId);
    if (!s) throw new Error('Player not initialized.');

    const result = await s.player.search(query, requester);
    const tracks = result?.tracks ?? [];
    if (!tracks.length) {
        throw new Error('No results found for that search.');
    }

    return tracks;
}

/**
 * Destroys the player for a guild.
 */
export async function destroy(guildId) {
    const lavalink = client?.lavalink;
    if (!lavalink) return;

    const player = lavalink.getPlayer(guildId);
    if (!player) return;

    try {
        await player.destroy('UserDisconnect', true);
    } catch (err) {
        logger.error('Lavalink', `Error destroying player ${guildId}`, err);
    }
}
