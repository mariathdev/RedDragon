import * as pm from '../../music/playerManager.js';
import { createControlCommand } from '../../music/controlCommand.js';

export const { data, execute } = createControlCommand({
    name: 'disconnect',
    description: 'Disconnect bot from voice channel',
    getWarning: (state) => !state.player
        ? 'The bot is not in any voice channel.'
        : null,
    run: async (state, interaction) => {
        if (typeof state.player.setData === 'function') {
            state.player.setData('leaving', true);
        }

        await pm.destroy(interaction.guildId);
        return { title: 'Disconnected', description: 'See you next time.' };
    },
});
