const { validateToken, generateToken } = require("./tokenValidator");

const sessions = new Map();

function createSession(userId) {
  const token = generateToken(userId);
  const session = {
    id: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    userId,
    token,
    createdAt: Date.now(),
    lastAccessed: Date.now(),
  };
  sessions.set(session.id, session);
  return session;
}

function restoreSession(sessionId, providedToken) {
  const session = sessions.get(sessionId);

  if (!session) {
    return { valid: false, reason: "Session not found" };
  }

  const result = validateToken(providedToken);

  if (!result.valid) {
    return { valid: false, reason: `Session token invalid: ${result.reason}` };
  }

  if (providedToken.userId !== session.userId) {
    return { valid: false, reason: "Token does not match session user" };
  }

  session.lastAccessed = Date.now();
  return { valid: true, session };
}

module.exports = { createSession, restoreSession };
