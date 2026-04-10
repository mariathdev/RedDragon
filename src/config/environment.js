import 'dotenv/config';

const DEFAULT_LAVALINK_PASSWORD = 'red-dragon';
const lavalinkPort = process.env.LAVALINK_PORT
    ? Number.parseInt(process.env.LAVALINK_PORT, 10)
    : null;

const REQUIRED = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'DISCORD_GUILD_ID'];

const missing = REQUIRED.filter(k => !process.env[k]);
if (missing.length) {
    console.error(`[FATAL] Missing environment variables: ${missing.join(', ')}`);
    console.error('[FATAL] Create a .env file and fill in the required values.');
    process.exit(1);
}

const LAVALINK_REQUIRED = ['LAVALINK_HOST', 'LAVALINK_PORT'];
const lavalinkMissing = LAVALINK_REQUIRED.filter(k => !process.env[k]);
if (lavalinkMissing.length) {
    console.warn(`[WARN] Missing Lavalink environment variables: ${lavalinkMissing.join(', ')}. Music via Lavalink will not be initialized.`);
} else if (!Number.isInteger(lavalinkPort)) {
    console.warn('[WARN] LAVALINK_PORT is invalid. Music via Lavalink will not be initialized.');
}

if (!process.env.GIF_API_KEY) {
    console.warn('[WARN] GIF_API_KEY not defined. Crit/fail GIFs disabled.');
}

if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    console.warn('[WARN] SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET not defined. Spotify URLs will not be supported.');
}

export const env = Object.freeze({
    token:    process.env.DISCORD_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,
    guildId:  process.env.DISCORD_GUILD_ID,
    gifKey:   process.env.GIF_API_KEY ?? null,
    spotify: {
        clientId:     process.env.SPOTIFY_CLIENT_ID ?? null,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET ?? null,
    },
    lavalink: {
        host: process.env.LAVALINK_HOST ?? null,
        port: Number.isInteger(lavalinkPort) ? lavalinkPort : null,
        password: process.env.LAVALINK_PASSWORD?.trim() || DEFAULT_LAVALINK_PASSWORD,
        secure: process.env.LAVALINK_SECURE === 'true',
        nodeId: process.env.LAVALINK_NODE_ID ?? 'Main Node',
        defaultSearchPlatform: process.env.LAVALINK_DEFAULT_SEARCH ?? 'ytmsearch',
    },
});
