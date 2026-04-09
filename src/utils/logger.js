function fmt(level, ctx, msg) {
    return `[${new Date().toISOString()}] [${level}] [${ctx}] ${msg}`;
}

function withStack(error) {
    if (error?.stack) console.error(`[STACK] ${error.stack}`);
}

export const logger = {
    debug: (ctx, msg) => console.debug(fmt('DEBUG', ctx, msg)),
    info:  (ctx, msg) => console.info(fmt('INFO', ctx, msg)),
    warn:  (ctx, msg) => console.warn(fmt('WARN', ctx, msg)),

    error(ctx, msg, err = null) {
        console.error(fmt('ERROR', ctx, msg));
        withStack(err);
    },

    fatal(ctx, msg, err = null) {
        console.error(fmt('FATAL', ctx, msg));
        withStack(err);
    },
};
