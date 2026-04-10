import { logger } from './logger.js';
import { handleInteractionError } from './errorHandler.js';

export async function executeCommand({ command, context, logContext, actorTag, invokedName, location }) {
    logger.info(logContext, `${actorTag} used ${invokedName} in ${location}`);

    try {
        await command.execute(context);
    } catch (err) {
        await handleInteractionError(context, err);
    }
}
