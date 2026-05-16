const { createOrder, updateOrderStatus } = require("./orderService");

async function processCheckout(userId, cartItems) {
  const order = createOrder(userId, cartItems);

  let paymentResult;
  try {
    const { validateCheckoutToken } = require("../payment/validateCheckoutToken");
    paymentResult = await validateCheckoutToken(userId, order.id);
  } catch (err) {
    updateOrderStatus(order.id, "payment_failed");
    throw new Error(`Checkout failed during payment validation: ${err.message}`);
  }

  if (!paymentResult.approved) {
    updateOrderStatus(order.id, "payment_declined");
    return { success: false, orderId: order.id, reason: paymentResult.reason };
  }

  updateOrderStatus(order.id, "confirmed");
  return { success: true, orderId: order.id, paymentId: paymentResult.paymentId };
}

module.exports = { processCheckout };
