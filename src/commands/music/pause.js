import { getTrackTitle } from '../../music/playerManager.js';
import { createControlCommand } from '../../music/controlCommand.js';

export const { data, execute } = createControlCommand({
    name: 'pause',
    description: 'Pause current song',
    getWarning: (state) => (!state.player || !state.currentTrack || state.player.paused)
        ? 'Nothing is playing right now.'
        : null,
    run: async (state) => {
        await state.player.pause();
        return { title: 'Paused', description: `**${getTrackTitle(state.currentTrack)}**` };
    },
});
