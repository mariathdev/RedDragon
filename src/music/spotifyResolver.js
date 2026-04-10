const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API_BASE  = 'https://api.spotify.com/v1';

let cachedToken  = null;
let tokenExpiry  = 0;

async function getAccessToken(clientId, clientSecret) {
    if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch(TOKEN_URL, {
        method:  'POST',
        headers: {
            'Content-Type':  'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`,
        },
        body: 'grant_type=client_credentials',
    });

    if (!res.ok) {
        throw new Error(`Spotify auth failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return cachedToken;
}

async function apiGet(path, token) {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Spotify API error ${res.status} on ${path}`);
    return res.json();
}

export function parseSpotifyUrl(query) {
    const urlMatch = query.match(/open\.spotify\.com\/(?:[a-zA-Z-]+\/)?(?:user\/[a-zA-Z0-9_-]+\/)?(track|album|playlist)\/([A-Za-z0-9]+)/);
    if (urlMatch) return { type: urlMatch[1], id: urlMatch[2] };

    const uriMatch = query.match(/^spotify:(track|album|playlist):([A-Za-z0-9]+)$/);
    if (uriMatch) return { type: uriMatch[1], id: uriMatch[2] };

    return null;
}

export function isSpotifyUrl(query) {
    return parseSpotifyUrl(query) !== null;
}

function formatTrack(track) {
    const artist = track.artists?.[0]?.name ?? '';
    return {
        title:       track.name,
        artist:      track.artists?.map(a => a.name).join(', ') ?? '',
        searchQuery: `${track.name} ${artist}`.trim(),
    };
}

export async function resolve(query, clientId, clientSecret) {
    const parsed = parseSpotifyUrl(query);
    if (!parsed) throw new Error('Not a valid Spotify URL.');

    const token = await getAccessToken(clientId, clientSecret);
    const { type, id } = parsed;

    if (type === 'track') {
        const track = await apiGet(`/tracks/${id}`, token);
        return {
            type:   'track',
            name:   track.name,
            tracks: [formatTrack(track)],
        };
    }

    if (type === 'album') {
        const [album, tracksData] = await Promise.all([
            apiGet(`/albums/${id}`, token),
            apiGet(`/albums/${id}/tracks?limit=50`, token),
        ]);
        return {
            type:   'album',
            name:   album.name,
            tracks: tracksData.items.map(formatTrack),
        };
    }

    if (type === 'playlist') {
        const playlist = await apiGet(
            `/playlists/${id}?fields=name,tracks.items(track(name,artists))`,
            token,
        );
        return {
            type:   'playlist',
            name:   playlist.name,
            tracks: playlist.tracks.items
                .filter(i => i.track)
                .map(i => formatTrack(i.track)),
        };
    }

    throw new Error(`Unsupported Spotify type: ${type}`);
}
