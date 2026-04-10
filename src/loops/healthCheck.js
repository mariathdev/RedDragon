import { logger } from '../utils/logger.js';
import { Loop } from '../config/constants.js';

let timer = null;
let tick = 0;
let failures = 0;

const WS_LABELS = {
    0: 'READY', 1: 'CONNECTING', 2: 'RECONNECTING', 3: 'IDLE',
    5: 'NEARLY', 6: 'DISCONNECTED', 7: 'WAITING_FOR_GUILDS',
    8: 'IDENTIFYING', 9: 'RESUMING',
};

export function startHealthLoop(client) {
    if (timer) {
        logger.warn('Health', 'Loop already running, ignoring duplicate call');
        return;
    }

    tick = 0;
    failures = 0;
    logger.info('Health', `Starting periodic check (${Loop.HEALTH_INTERVAL_MS}ms)`);
    timer = setInterval(() => check(client), Loop.HEALTH_INTERVAL_MS);
}

export function stopHealthLoop() {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
    logger.info('Health', `Loop stopped after ${tick} cycle(s)`);
    tick = 0;
    failures = 0;
}

function check(client) {
    tick++;
    const ws     = client.ws.status;
    const label  = WS_LABELS[ws] ?? `UNKNOWN(${ws})`;
    const ping   = client.ws.ping;
    const guilds = client.guilds.cache.size;

    const healthy = ws === 0 && ping >= 0 && ping < 5000;

    if (healthy) {
        failures = 0;
        logger.debug('Health', `#${tick} OK | WS: ${label} | Ping: ${ping}ms | Guilds: ${guilds}`);
        return;
    }

    failures++;
    logger.warn('Health', `#${tick} FAILURE (${failures}x) | WS: ${label} | Ping: ${ping}ms`);

    if (failures >= Loop.MAX_RECONNECT_ATTEMPTS) {
        logger.error('Health', `${failures} consecutive failures, critical state`);
        failures = 0;
    }
}
