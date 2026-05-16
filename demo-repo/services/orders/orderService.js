const { authMiddleware } = require("../auth/authMiddleware");

const orders = [];

function createOrder(userId, items) {
  const order = {
    id: `ord_${Date.now()}`,
    userId,
    items,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  orders.push(order);
  return order;
}

function getOrder(orderId) {
  return orders.find((o) => o.id === orderId) || null;
}

function getOrdersByUser(userId) {
  return orders.filter((o) => o.userId === userId);
}

function updateOrderStatus(orderId, status) {
  const order = orders.find((o) => o.id === orderId);
  if (order) {
    order.status = status;
  }
  return order;
}

module.exports = { createOrder, getOrder, getOrdersByUser, updateOrderStatus, authMiddleware };
