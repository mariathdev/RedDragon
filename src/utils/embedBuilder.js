import { EmbedBuilder } from 'discord.js';
import { Colors, Bot } from '../config/constants.js';

export function createEmbed(opts = {}) {
    const embed = new EmbedBuilder()
        .setColor(opts.color ?? Colors.DRAGON_BLOOD)
        .setFooter({ text: opts.footer ?? Bot.FOOTER_TEXT })
        .setTimestamp();

    if (opts.title)       embed.setTitle(opts.title);
    if (opts.description) embed.setDescription(opts.description);
    if (opts.thumbnail)   embed.setThumbnail(opts.thumbnail);
    if (opts.fields?.length) embed.addFields(opts.fields);

    return embed;
}

export function successEmbed(opts = {}) {
    return createEmbed({ ...opts, color: Colors.DRACO_GREEN, title: opts.title ?? 'Success' });
}

export function warningEmbed(opts = {}) {
    return createEmbed({ ...opts, color: Colors.FYRE_ORANGE, title: opts.title ?? 'Warning' });
}

export function errorEmbed(opts = {}) {
    return createEmbed({
        ...opts,
        color: Colors.DRAGON_BLOOD,
        title: opts.title ?? 'Error',
        description: opts.description ?? 'An unexpected error occurred.',
    });
}
