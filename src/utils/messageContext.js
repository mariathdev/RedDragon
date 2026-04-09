export function createContext(message, commandName, args) {
    let placeholder = null;

    const ctx = {
        commandName,
        guildId:  message.guildId,
        guild:    message.guild,
        channel:  message.channel,
        member:   message.member,
        user:     message.author,
        client:   message.client,
        replied:  false,
        deferred: false,

        options: {
            getString:  () => args.join(' ') || null,
            getInteger: () => { const n = parseInt(args[0]); return isNaN(n) ? null : n; },
            getBoolean: () => null,
        },

        async deferReply() {
            ctx.deferred  = true;
            placeholder   = await message.channel.send({ content: '...' });
        },

        async editReply(data) {
            const payload = stripEphemeral(data);
            if (placeholder) return placeholder.edit(payload);
            return message.channel.send(payload);
        },

        async reply(data) {
            ctx.replied = true;
            return message.reply(stripEphemeral(data));
        },

        async followUp(data) {
            return message.channel.send(stripEphemeral(data));
        },
    };

    return ctx;
}

function stripEphemeral(data) {
    if (!data || typeof data !== 'object') return data;
    const { ephemeral: _e, ...rest } = data;
    return rest;
}
