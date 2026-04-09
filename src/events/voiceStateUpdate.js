import * as pm from '../music/playerManager.js';
import { fetchGif } from '../utils/gifProvider.js';
import { createEmbed } from '../utils/embedBuilder.js';

export const name = 'voiceStateUpdate';

export async function execute(oldState, newState) {
    if (oldState.member?.id !== oldState.guild?.members?.me?.id) return;
    if (!oldState.channelId || newState.channelId) return;

    const s = pm.get(oldState.guild.id);
    if (!s) return;

    const isLeaving = typeof s.player.getData === 'function' ? s.player.getData('leaving') : false;
    if (isLeaving) {
        await pm.destroy(oldState.guild.id);
        return;
    }

    const textChannel = s.textChannel;
    await pm.destroy(oldState.guild.id);

    if (!textChannel) return;

    const gif   = await fetchGif('aqua cry');
    const embed = createEmbed({ description: 'You... abandoned me.' });
    if (gif) embed.setImage(gif);

    textChannel.send({ embeds: [embed] }).catch(() => {});
}
