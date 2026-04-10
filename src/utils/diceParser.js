import { Dice } from '../config/constants.js';

function rollN(count, sides) {
    return Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
}

function validate(count, sides) {
    if (count > Dice.MAX_DICE)  return `Maximum of ${Dice.MAX_DICE} dice per roll.`;
    if (sides > Dice.MAX_SIDES) return `Maximum of ${Dice.MAX_SIDES} sides per die.`;
    if (count < 1)              return 'Dice count must be at least 1.';
    if (sides < 2)              return 'Die must have at least 2 sides.';
    return null;
}

export function parse(raw) {
    const expr = raw.trim().toLowerCase().replace(/\s+/g, '');

    let m;

    m = expr.match(/^(\d+)?d(\d+)dl(\d+)$/);
    if (m) {
        const count = parseInt(m[1] ?? '1');
        const sides = parseInt(m[2]);
        const drop  = parseInt(m[3]);
        const err   = validate(count, sides);
        if (err) return { error: err };
        if (drop >= count) return { error: 'Cannot drop more dice than rolled.' };

        const rolls      = rollN(count, sides);
        const byIdx      = rolls.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
        const droppedIdx = new Set(byIdx.slice(0, drop).map(([, i]) => i));
        const kept = rolls.filter((_, i) => !droppedIdx.has(i));
        return { type: 'drop', count, sides, drop, rolls, droppedIdx, total: kept.reduce((s, v) => s + v, 0) };
    }

    m = expr.match(/^(\d+)#(\d+)?d(\d+)$/);
    if (m) {
        const groups = Math.min(parseInt(m[1]), 20);
        const count  = parseInt(m[2] ?? '1');
        const sides  = parseInt(m[3]);
        const err    = validate(count, sides);
        if (err) return { error: err };

        const results = Array.from({ length: groups }, () => {
            const rolls = rollN(count, sides);
            return { rolls, total: rolls.reduce((s, v) => s + v, 0) };
        });
        return { type: 'multi', groups, count, sides, results };
    }

    m = expr.match(/^(\d+)?d(\d+)([+-])(\d+)$/);
    if (m) {
        const count    = parseInt(m[1] ?? '1');
        const sides    = parseInt(m[2]);
        const sign     = m[3];
        const modifier = parseInt(m[4]);
        const err      = validate(count, sides);
        if (err) return { error: err };

        const rolls = rollN(count, sides);
        const sum   = rolls.reduce((s, v) => s + v, 0);
        return { type: 'modifier', count, sides, sign, modifier, rolls, total: sign === '+' ? sum + modifier : sum - modifier };
    }

    m = expr.match(/^(\d+)?d(\d+)$/);
    if (m) {
        const count = parseInt(m[1] ?? '1');
        const sides = parseInt(m[2]);
        const err   = validate(count, sides);
        if (err) return { error: err };

        const rolls = rollN(count, sides);
        return { type: 'simple', count, sides, rolls, total: rolls.reduce((s, v) => s + v, 0) };
    }

    return { error: 'Invalid format. Examples: `d20`, `2d6`, `1d20+5`, `4d6dl1`, `5#1d20`' };
}
