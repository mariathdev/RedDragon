import { createControlCommand } from '../../music/controlCommand.js';

export const { data, execute } = createControlCommand({
    name: 'stop',
    description: 'Stop music and clear queue',
    getWarning: (state) => (!state.player || (!state.currentTrack && state.player.queue.tracks.length === 0))
        ? 'Nothing is playing right now.'
        : null,
    run: async (state) => {
        await state.player.stopPlaying(true);
        return { title: 'Stopped', description: 'Queue cleared and playback ended.' };
    },
});
