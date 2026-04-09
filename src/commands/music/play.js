import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';
import * as pm from '../../music/playerManager.js';
import { isSpotifyUrl, resolve as resolveSpotify } from '../../music/spotifyResolver.js';
import { createEmbed, errorEmbed, warningEmbed } from '../../utils/embedBuilder.js';
import { logger } from '../../utils/logger.js';
import { Colors, Music } from '../../config/constants.js';
import { env } from '../../config/environment.js';

export const data = new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play music or add to queue')
    .addStringOption(o =>
        o.setName('busca')
         .setDescription('YouTube/Spotify URL or song name')
         .setRequired(true)
    );

export async function execute(interaction) {
    await interaction.deferReply();

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
        return interaction.editReply({ embeds: [warningEmbed({ description: 'You need to be in a voice channel.' })] });
    }

    const perms = voiceChannel.permissionsFor(interaction.guild.members.me);
    if (!perms.has(PermissionsBitField.Flags.Connect) || !perms.has(PermissionsBitField.Flags.Speak)) {
        return interaction.editReply({ embeds: [errorEmbed({ description: 'No permission to join or speak in the channel.' })] });
    }

    try {
        await pm.connect(interaction.guildId, voiceChannel, interaction.channel);
    } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed({ description: err.message })] });
    }

    const query = interaction.options.getString('busca');

    if (isSpotifyUrl(query)) {
        return handleSpotify(interaction, query);
    }

    return handleSearch(interaction, query);
}

async function handleSearch(interaction, query) {
    let tracks;
    try {
        tracks = await pm.resolve(interaction.guildId, query, interaction.user.username);
    } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed({ description: err.message })] });
    }

    if (!tracks?.length) {
        return interaction.editReply({ embeds: [errorEmbed({ description: 'No tracks found.' })] });
    }

    const track = tracks[0];
    track.requester = interaction.user.username;

    const errMsg = await pm.enqueue(interaction.guildId, track);
    if (errMsg) {
        return interaction.editReply({ embeds: [warningEmbed({ description: errMsg.error })] });
    }

    const embed = createEmbed({
        color:       Colors.FYRE_ORANGE,
        title:       'Added to queue',
        description: `**${track?.info?.title ?? track?.title ?? 'Song'}**`,
        fields:      [{ name: 'Requested by', value: interaction.user.username, inline: true }],
    });
    return interaction.editReply({ embeds: [embed] });
}

async function handleSpotify(interaction, query) {
    if (!env.spotify.clientId || !env.spotify.clientSecret) {
        return interaction.editReply({ embeds: [errorEmbed({ description: 'Spotify credentials not configured.' })] });
    }

    let spotifyResult;
    try {
        spotifyResult = await resolveSpotify(query, env.spotify.clientId, env.spotify.clientSecret);
    } catch (err) {
        logger.error('Spotify', 'Failed to resolve URL', err);
        return interaction.editReply({ embeds: [errorEmbed({ description: `Spotify error: ${err.message}` })] });
    }

    const { type, name, tracks } = spotifyResult;

    if (type === 'track') {
        const { searchQuery, title } = tracks[0];
        let laTracks;
        try {
            laTracks = await pm.resolve(interaction.guildId, `ytmsearch:${searchQuery}`, interaction.user.username);
        } catch (err) {
            return interaction.editReply({ embeds: [errorEmbed({ description: err.message })] });
        }

        if (!laTracks?.length) {
            return interaction.editReply({ embeds: [errorEmbed({ description: `No results found for: ${title}` })] });
        }

        const track = laTracks[0];
        track.requester = interaction.user.username;

        const errMsg = await pm.enqueue(interaction.guildId, track);
        if (errMsg) {
            return interaction.editReply({ embeds: [warningEmbed({ description: errMsg.error })] });
        }

        const embed = createEmbed({
            color:       Colors.FYRE_ORANGE,
            title:       'Added to queue',
            description: `**${track?.info?.title ?? title}**`,
            fields:      [{ name: 'Requested by', value: interaction.user.username, inline: true }],
        });
        return interaction.editReply({ embeds: [embed] });
    }

    // Album or playlist — bulk enqueue
    const cappedTracks = tracks.slice(0, Music.MAX_QUEUE);
    const typeLabel = type === 'album' ? 'Album' : 'Playlist';

    const loadingEmbed = createEmbed({
        color:       Colors.FYRE_ORANGE,
        title:       `Loading ${typeLabel}`,
        description: `**${name}** — ${cappedTracks.length} tracks\nThis may take a moment...`,
        fields:      [{ name: 'Requested by', value: interaction.user.username, inline: true }],
    });
    await interaction.editReply({ embeds: [loadingEmbed] });

    let added = 0;
    for (const spotTrack of cappedTracks) {
        try {
            const laTracks = await pm.resolve(
                interaction.guildId,
                `ytmsearch:${spotTrack.searchQuery}`,
                interaction.user.username,
            );
            if (!laTracks?.length) continue;
            const track = laTracks[0];
            track.requester = interaction.user.username;
            const err = await pm.enqueue(interaction.guildId, track);
            if (!err) added++;
        } catch (err) {
            logger.warn('Spotify', `Skipped track "${spotTrack.title}": ${err.message}`);
        }
    }

    const doneEmbed = createEmbed({
        color:       Colors.DRACO_GREEN,
        title:       `${typeLabel} loaded`,
        description: `**${name}** — ${added}/${cappedTracks.length} tracks added`,
        fields:      [{ name: 'Requested by', value: interaction.user.username, inline: true }],
    });
    return interaction.followUp({ embeds: [doneEmbed] });
}
