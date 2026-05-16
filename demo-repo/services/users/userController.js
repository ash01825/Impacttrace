const { authMiddleware } = require("../auth/authMiddleware");

const users = [
  { id: "usr_demo1", name: "Alice Chen", email: "alice@example.com" },
  { id: "usr_demo2", name: "Bob Martinez", email: "bob@example.com" },
];

function handleGetProfile(req, res) {
  const user = users.find((u) => u.id === req.userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json(user);
}

function handleUpdateProfile(req, res) {
  const user = users.find((u) => u.id === req.userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const { name, email } = req.body;
  if (name) user.name = name;
  if (email) user.email = email;

  return res.json(user);
}

module.exports = { handleGetProfile, handleUpdateProfile, authMiddleware };
