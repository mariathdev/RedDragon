import { fetchGif } from '../utils/gifProvider.js';

function formatRollValues(rolls, droppedIndexes = new Set()) {
    return rolls
        .map((value, index) => (droppedIndexes.has(index) ? `~~${value}~~` : String(value)))
        .join(', ');
}

function hasCriticalFailure(result) {
    return result.rolls?.includes(1);
}

function hasCriticalSuccess(result) {
    return result.rolls?.includes(result.sides);
}

async function resolveRollFlavor(result) {
    if (result.type === 'multi') {
        return { title: 'RedDragon Dice', gif: null };
    }

    if (hasCriticalFailure(result)) {
        return {
            title: 'EPIC FAIL',
            gif: await fetchGif('anime fail'),
        };
    }

    if (hasCriticalSuccess(result)) {
        return {
            title: 'EPIC SUCCESS',
            gif: await fetchGif('anime power'),
        };
    }

    return { title: 'RedDragon Dice', gif: null };
}

function buildDescription(result) {
    switch (result.type) {
        case 'simple':
            return `[${formatRollValues(result.rolls)}] = **${result.total}**`;
        case 'modifier':
            return `[${formatRollValues(result.rolls)}] ${result.sign} ${result.modifier} = **${result.total}**`;
        case 'drop':
            return `[${formatRollValues(result.rolls, result.droppedIdx)}] = **${result.total}**\n-# Dropped lowest ${result.drop}`;
        case 'multi':
            return result.results
                .map((item, index) => `${index + 1}. [${formatRollValues(item.rolls)}] = **${item.total}**`)
                .join('\n');
        default:
            return '';
    }
}

export async function buildRollPresentation(result) {
    const { title, gif } = await resolveRollFlavor(result);

    return {
        title,
        description: buildDescription(result),
        gif,
    };
}
