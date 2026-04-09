import { env } from '../config/environment.js';
import { logger } from './logger.js';

export async function fetchGif(query) {
    if (!env.gifKey) return null;
    try {
        const url  = `https://api.klipy.com/api/v1/${env.gifKey}/gifs/search?q=${encodeURIComponent(query)}&customer_id=red-dragon-bot&per_page=10&format_filter=gif`;
        const res  = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        const gifs = data?.data?.data ?? [];
        if (!gifs.length) return null;
        const randomGif = gifs[Math.floor(Math.random() * gifs.length)];
        return randomGif?.file?.md?.gif?.url ?? null;
    } catch (err) {
        logger.warn('GifProvider', `Failed to fetch GIF for "${query}": ${err.message}`);
        return null;
    }
}
