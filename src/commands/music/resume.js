import { getTrackTitle } from '../../music/playerManager.js';
import { createControlCommand } from '../../music/controlCommand.js';

export const { data, execute } = createControlCommand({
    name: 'resume',
    description: 'Resume paused song',
    getWarning: (state) => (!state.player || !state.currentTrack || !state.player.paused)
        ? 'Nothing is paused right now.'
        : null,
    run: async (state) => {
        await state.player.resume();
        return { title: 'Resumed', description: `**${getTrackTitle(state.currentTrack)}**` };
    },
});
