const fs = require("fs");
const path = require("path");

const tokenSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../shared/config/token-schema.json"), "utf-8")
);

const preferences = new Map();

function getPreferences(userId) {
  if (!preferences.has(userId)) {
    preferences.set(userId, {
      theme: "dark",
      notifications: true,
      language: "en",
      tokenFormat: tokenSchema.$schema,
    });
  }
  return preferences.get(userId);
}

function updatePreferences(userId, updates) {
  const current = getPreferences(userId);
  preferences.set(userId, { ...current, ...updates });
  return preferences.get(userId);
}

module.exports = { getPreferences, updatePreferences };
