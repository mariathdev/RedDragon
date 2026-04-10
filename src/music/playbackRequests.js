import * as playerManager from './playerManager.js';
import { createEmbed } from '../utils/embedBuilder.js';
import { Colors } from '../config/constants.js';

export async function resolveTracks(guildId, query, requester) {
    return playerManager.resolve(guildId, query, requester);
}

export async function enqueueFirstResolvedTrack({ guildId, query, requester, fallbackTitle = 'Song' }) {
    const tracks = await resolveTracks(guildId, query, requester);
    const track = tracks?.[0];

    if (!track) {
        throw new Error(`No results found for: ${fallbackTitle}`);
    }

    track.requester = requester;

    const enqueueResult = await playerManager.enqueue(guildId, track);

    return {
        track,
        enqueueResult,
    };
}

export function createQueuedTrackEmbed(title, requester) {
    return createEmbed({
        color: Colors.FYRE_ORANGE,
        title: 'Added to queue',
        description: `**${title}**`,
        fields: [{ name: 'Requested by', value: requester, inline: true }],
    });
}
