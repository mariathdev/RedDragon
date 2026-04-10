import * as playerManager from './playerManager.js';

export function getPlaybackState(guildId) {
    const state = playerManager.get(guildId);
    const player = state?.player ?? null;
    const currentTrack = player?.queue?.current ?? player?.track ?? null;

    return {
        ...(state ?? {}),
        player,
        currentTrack,
    };
}

export function getTrackTitle(track, fallback = 'current song') {
    return track?.info?.title ?? track?.title ?? fallback;
}
