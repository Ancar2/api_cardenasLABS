const crypto = require('crypto');

const DEFAULT_TTL_MS = Number(process.env.LINKEDIN_PUBLISH_SESSION_TTL_MS || 15 * 60 * 1000);
const sessions = new Map();

const createPublishSession = ({ accessToken, linkedinSub }) => {
    const id = crypto.randomBytes(24).toString('hex');
    const expiresAt = Date.now() + DEFAULT_TTL_MS;
    sessions.set(id, { accessToken, linkedinSub, expiresAt });
    return { id, expiresAt };
};

const consumePublishSession = (id) => {
    const session = sessions.get(id);
    if (!session) return null;
    sessions.delete(id);
    if (session.expiresAt < Date.now()) return null;
    return session;
};

const getPublishSession = (id) => {
    const session = sessions.get(id);
    if (!session) return null;
    if (session.expiresAt < Date.now()) {
        sessions.delete(id);
        return null;
    }
    return session;
};

setInterval(() => {
    const now = Date.now();
    for (const [id, session] of sessions.entries()) {
        if (session.expiresAt < now) sessions.delete(id);
    }
}, 60 * 1000).unref();

module.exports = {
    createPublishSession,
    consumePublishSession,
    getPublishSession,
};

