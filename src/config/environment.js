import 'dotenv/config';

const REQUIRED = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'DISCORD_GUILD_ID'];

const missing = REQUIRED.filter(k => !process.env[k]);
if (missing.length) {
    console.error(`[FATAL] Missing environment variables: ${missing.join(', ')}`);
    console.error('[FATAL] Copy .env.example to .env and fill in the values.');
    process.exit(1);
}

const LAVALINK_REQUIRED = ['LAVALINK_HOST', 'LAVALINK_PORT', 'LAVALINK_PASSWORD'];
const lavalinkMissing = LAVALINK_REQUIRED.filter(k => !process.env[k]);
if (lavalinkMissing.length) {
    console.warn(`[WARN] Missing Lavalink environment variables: ${lavalinkMissing.join(', ')}. Music via Lavalink will not be initialized.`);
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
        port: process.env.LAVALINK_PORT ? Number(process.env.LAVALINK_PORT) : null,
        password: process.env.LAVALINK_PASSWORD ?? null,
        secure: process.env.LAVALINK_SECURE === 'true',
        nodeId: process.env.LAVALINK_NODE_ID ?? 'Main Node',
        defaultSearchPlatform: process.env.LAVALINK_DEFAULT_SEARCH ?? 'ytmsearch',
    },
});
