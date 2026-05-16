const { validateCheckoutToken } = require("./validateCheckoutToken");

async function processPayment(userId, orderId, amount) {
  const validation = validateCheckoutToken(userId, orderId);

  if (!validation.approved) {
    return {
      success: false,
      reason: `Payment validation failed: ${validation.reason}`,
    };
  }

  return {
    success: true,
    transactionId: `txn_${Date.now()}`,
    paymentId: validation.paymentId,
    amount,
  };
}

module.exports = { processPayment };
