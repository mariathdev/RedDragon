import { logger } from '../utils/logger.js';

export function registerProcessLifecycle(client) {
    process.on('unhandledRejection', (err) => {
        logger.fatal('Process', 'Unhandled promise rejection', err);
    });

    process.on('uncaughtException', (err) => {
        logger.fatal('Process', 'Uncaught exception', err);
        process.exit(1);
    });

    const shutdown = (signal) => {
        logger.info('Process', `Received ${signal}, shutting down...`);
        client.destroy();
        process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}
