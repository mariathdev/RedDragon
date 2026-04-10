import { getTrackTitle } from '../../music/playerManager.js';
import { createControlCommand } from '../../music/controlCommand.js';

export const { data, execute } = createControlCommand({
    name: 'skip',
    description: 'Skip current song',
    getWarning: (state) => (!state.player || !state.currentTrack)
        ? 'Nothing is playing right now.'
        : null,
    run: async (state) => {
        const skipped = getTrackTitle(state.currentTrack);
        await state.player.skip();
        return { title: 'Skipped', description: `**${skipped}**` };
    },
});
