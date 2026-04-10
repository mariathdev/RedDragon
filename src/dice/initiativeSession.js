const sessions = new Map();
const MAX_PARTICIPANTS = 12;

export function hasSession(channelId) {
    return sessions.has(channelId);
}

export function startSession(channelId, startedBy) {
    sessions.set(channelId, { entries: [], startedBy });
}

export function getSession(channelId) {
    return sessions.get(channelId) ?? null;
}

export function registerInitiativeRoll(channelId, entry) {
    const session = getSession(channelId);

    if (!session) {
        return { ok: false, reason: 'missing_session' };
    }

    const existingEntry = session.entries.find((item) => item.userId === entry.userId);
    if (existingEntry) {
        return { ok: false, reason: 'already_registered', entry: existingEntry };
    }

    if (session.entries.length >= MAX_PARTICIPANTS) {
        return { ok: false, reason: 'session_full' };
    }

    session.entries.push(entry);
    return { ok: true, position: session.entries.length };
}

export function closeSession(channelId) {
    const session = getSession(channelId);
    if (!session) {
        return null;
    }

    sessions.delete(channelId);

    return {
        startedBy: session.startedBy,
        entries: [...session.entries].sort((left, right) => right.total - left.total),
    };
}

export function createInitiativeEntry({ userId, userName, result, expression }) {
    return {
        userId,
        name: userName,
        total: result.total,
        expression,
        modifier: result.type === 'modifier' ? `${result.sign}${result.modifier}` : null,
    };
}

export { MAX_PARTICIPANTS };
