const { validateToken } = require("./tokenValidator");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const tokenString = authHeader.slice(7);
  let tokenObj;

  try {
    tokenObj = JSON.parse(Buffer.from(tokenString, "base64").toString("utf-8"));
  } catch {
    return res.status(401).json({ error: "Malformed token" });
  }

  const result = validateToken(tokenObj);

  if (!result.valid) {
    return res.status(401).json({ error: `Token validation failed: ${result.reason}` });
  }

  req.userId = tokenObj.userId;
  next();
}

module.exports = { authMiddleware };
