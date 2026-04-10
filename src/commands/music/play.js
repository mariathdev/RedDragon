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
        o.setName('query')
         .setDescription('YouTube/Spotify URL or song name')
         .setRequired(true)
    );

export async function execute(interaction) {
    const query = interaction.options.getString('query');
    if (!query) {
        return interaction.reply({
            embeds: [warningEmbed({ description: 'Provide a search query or a supported URL.' })],
            ephemeral: true,
        });
    }

    await interaction.deferReply();

    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
        return interaction.editReply({ embeds: [warningEmbed({ description: 'You need to be in a voice channel.' })] });
    }

    const perms = voiceChannel.permissionsFor(interaction.client.user);
    if (!perms?.has(PermissionsBitField.Flags.Connect) || !perms.has(PermissionsBitField.Flags.Speak)) {
        return interaction.editReply({ embeds: [errorEmbed({ description: 'No permission to join or speak in the channel.' })] });
    }

    try {
        await pm.connect(interaction.guildId, voiceChannel, interaction.channel);
    } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed({ description: err.message })] });
    }

    return isSpotifyUrl(query)
        ? handleSpotify(interaction, query)
        : handleSearch(interaction, query);
}

async function handleSearch(interaction, query) {
    try {
        const { track, enqueueResult } = await enqueueFirstResolvedTrack({
            guildId: interaction.guildId,
            query,
            requester: interaction.user.username,
        });

        if (enqueueResult) {
            return interaction.editReply({ embeds: [warningEmbed({ description: enqueueResult.error })] });
        }

        return interaction.editReply({
            embeds: [createQueuedTrackEmbed(track?.info?.title ?? track?.title ?? 'Song', interaction.user.username)],
        });
    } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed({ description: err.message })] });
    }
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

        try {
            const { track, enqueueResult } = await enqueueFirstResolvedTrack({
                guildId: interaction.guildId,
                query: `ytmsearch:${searchQuery}`,
                requester: interaction.user.username,
                fallbackTitle: title,
            });

            if (enqueueResult) {
                return interaction.editReply({ embeds: [warningEmbed({ description: enqueueResult.error })] });
            }

            return interaction.editReply({
                embeds: [createQueuedTrackEmbed(track?.info?.title ?? title, interaction.user.username)],
            });
        } catch (err) {
            return interaction.editReply({ embeds: [errorEmbed({ description: err.message })] });
        }
    }

    const cappedTracks = tracks.slice(0, Music.MAX_QUEUE);
    const typeLabel = type === 'album' ? 'Album' : 'Playlist';

    await interaction.editReply({
        embeds: [createEmbed({
            color: Colors.FYRE_ORANGE,
            title: `Loading ${typeLabel}`,
            description: `**${name}** - ${cappedTracks.length} tracks\nThis may take a moment...`,
            fields: [{ name: 'Requested by', value: interaction.user.username, inline: true }],
        })],
    });

    let added = 0;
    for (const spotifyTrack of cappedTracks) {
        try {
            const tracksFromSearch = await pm.resolve(
                interaction.guildId,
                `ytmsearch:${spotifyTrack.searchQuery}`,
                interaction.user.username,
            );

            if (!tracksFromSearch?.length) {
                continue;
            }

            const track = tracksFromSearch[0];
            track.requester = interaction.user.username;

            if (!await pm.enqueue(interaction.guildId, track)) {
                added++;
            }
        } catch (err) {
            logger.warn('Spotify', `Skipped track "${spotifyTrack.title}": ${err.message}`);
        }
    }

    return interaction.followUp({
        embeds: [createEmbed({
            color: Colors.DRACO_GREEN,
            title: `${typeLabel} loaded`,
            description: `**${name}** - ${added}/${cappedTracks.length} tracks added`,
            fields: [{ name: 'Requested by', value: interaction.user.username, inline: true }],
        })],
    });
}

async function enqueueFirstResolvedTrack({ guildId, query, requester, fallbackTitle = 'Song' }) {
    const tracks = await pm.resolve(guildId, query, requester);
    const track = tracks?.[0];

    if (!track) {
        throw new Error(`No results found for: ${fallbackTitle}`);
    }

    track.requester = requester;

    return {
        track,
        enqueueResult: await pm.enqueue(guildId, track),
    };
}

function createQueuedTrackEmbed(title, requester) {
    return createEmbed({
        color: Colors.FYRE_ORANGE,
        title: 'Added to queue',
        description: `**${title}**`,
        fields: [{ name: 'Requested by', value: requester, inline: true }],
    });
}
