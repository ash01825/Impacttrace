const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const schema = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../shared/config/token-schema.json"), "utf-8")
);

function validateToken(tokenObj) {
  if (!tokenObj || typeof tokenObj !== "object") {
    return { valid: false, reason: "Token must be an object" };
  }

  if (!tokenObj.token || typeof tokenObj.token !== "string" || tokenObj.token.length < 32) {
    return { valid: false, reason: "Invalid token string" };
  }

  if (!tokenObj.userId || !/^usr_[a-zA-Z0-9]+$/.test(tokenObj.userId)) {
    return { valid: false, reason: "Invalid user ID format" };
  }

  if (!tokenObj.timestamp || typeof tokenObj.timestamp !== "number") {
    return { valid: false, reason: "Missing or invalid timestamp" };
  }

  if (!tokenObj.signature || typeof tokenObj.signature !== "string" || tokenObj.signature.length < 64) {
    return { valid: false, reason: "Invalid signature" };
  }

  const expiryMs = 24 * 60 * 60 * 1000;
  if (Date.now() - tokenObj.timestamp > expiryMs) {
    return { valid: false, reason: "Token expired" };
  }

  return { valid: true };
}

function generateToken(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const timestamp = Date.now();
  const signature = crypto
    .createHmac("sha256", process.env.TOKEN_SECRET || "dev-secret")
    .update(`${token}:${userId}:${timestamp}`)
    .digest("hex");

  return { token, userId, timestamp, signature };
}

module.exports = { validateToken, generateToken };
