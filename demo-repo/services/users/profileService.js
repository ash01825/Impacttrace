const { restoreSession } = require("../auth/sessionManager");

function getProfile(userId, sessionId, token) {
  const sessionResult = restoreSession(sessionId, token);

  if (!sessionResult.valid) {
    return { error: "Invalid session" };
  }

  return {
    userId,
    sessionId,
    preferences: loadPreferences(userId),
  };
}

function loadPreferences(userId) {
  return {
    theme: "dark",
    notifications: true,
    language: "en",
  };
}

module.exports = { getProfile };
