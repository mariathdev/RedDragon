import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, warningEmbed } from '../../utils/embedBuilder.js';
import { Colors, Music } from '../../config/constants.js';
import { getPlaybackState, getTrackTitle } from '../../music/commandSupport.js';

export const data = new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Display music queue')
    .addIntegerOption(o =>
        o.setName('page')
         .setDescription('Page number')
         .setMinValue(1)
    );

export async function execute(interaction) {
    const state = getPlaybackState(interaction.guildId);

    if (!state.player || (!state.currentTrack && state.player.queue.tracks.length === 0)) {
        return interaction.reply({ embeds: [warningEmbed({ description: 'The queue is empty.' })], ephemeral: true });
    }

    const page = interaction.options.getInteger('page') ?? 1;
    const tracks = state.player.queue.tracks;
    const total = tracks.length;
    const pages = Math.max(1, Math.ceil(total / Music.PAGE_SIZE));
    const start = (page - 1) * Music.PAGE_SIZE;
    const slice = tracks.slice(start, start + Music.PAGE_SIZE);

    const lines = slice.map((t, i) => `**${start + i + 1}.** ${t.info?.title ?? t.title} — *${t.requester ?? 'Unknown'}*`);

    const embed = createEmbed({
        color:       Colors.FYRE_ORANGE,
        title:       'Playback Queue',
        description: lines.join('\n') || 'No songs in queue.',
        fields:      [
            state.currentTrack
                ? { name: 'Now Playing', value: `**${getTrackTitle(state.currentTrack)}**`, inline: false }
                : null,
            { name: 'Total', value: String(total), inline: true },
            { name: 'Page', value: `${page}/${pages}`, inline: true },
        ].filter(Boolean),
    });

    return interaction.reply({ embeds: [embed] });
}
