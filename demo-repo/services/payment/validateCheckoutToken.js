// WARNING: No import from auth/tokenValidator.js
// Behavioral contract via shared/config/token-schema.json — implicit dependency

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const schema = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../shared/config/token-schema.json"), "utf-8")
);

function validateCheckoutToken(userId, orderId) {
  const rawToken = process.env.CHECKOUT_TOKEN || generateMockToken(userId);

  let tokenObj;
  try {
    tokenObj = typeof rawToken === "string" ? JSON.parse(rawToken) : rawToken;
  } catch {
    return { approved: false, reason: "Malformed checkout token" };
  }

  if (!tokenObj.token || typeof tokenObj.token !== "string" || tokenObj.token.length < 32) {
    return { approved: false, reason: "Invalid token format — does not match expected schema" };
  }

  if (!tokenObj.userId || tokenObj.userId !== userId) {
    return { approved: false, reason: "Token user mismatch" };
  }

  if (!tokenObj.signature || typeof tokenObj.signature !== "string" || tokenObj.signature.length < 64) {
    return { approved: false, reason: "Invalid token signature — schema violation" };
  }

  const expectedSig = crypto
    .createHmac("sha256", process.env.TOKEN_SECRET || "dev-secret")
    .update(`${tokenObj.token}:${tokenObj.userId}:${tokenObj.timestamp}`)
    .digest("hex");

  if (tokenObj.signature !== expectedSig) {
    return { approved: false, reason: "Token signature verification failed" };
  }

  if (Date.now() - tokenObj.timestamp > 24 * 60 * 60 * 1000) {
    return { approved: false, reason: "Checkout token expired" };
  }

  return {
    approved: true,
    paymentId: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
  };
}

function generateMockToken(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const timestamp = Date.now();
  const signature = crypto
    .createHmac("sha256", process.env.TOKEN_SECRET || "dev-secret")
    .update(`${token}:${userId}:${timestamp}`)
    .digest("hex");

  return JSON.stringify({ token, userId, timestamp, signature });
}

module.exports = { validateCheckoutToken };
