const { createOrder, getOrdersByUser, updateOrderStatus } = require("./orderService");

function handleCreateOrder(req, res) {
  const { items } = req.body;
  const userId = req.userId;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Order must contain at least one item" });
  }

  const order = createOrder(userId, items);
  return res.status(201).json(order);
}

function handleGetOrders(req, res) {
  const userId = req.userId;
  const orders = getOrdersByUser(userId);
  return res.json(orders);
}

module.exports = { handleCreateOrder, handleGetOrders };
