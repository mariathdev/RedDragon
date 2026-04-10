import { logger } from '../utils/logger.js';

export const name = 'error';
export const once = false;

export async function execute(error) {
    logger.error('Client', 'Discord client error', error);
}
