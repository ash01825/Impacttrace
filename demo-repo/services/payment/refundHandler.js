const { validateCheckoutToken } = require("./validateCheckoutToken");

async function processRefund(userId, transactionId, amount) {
  const validation = validateCheckoutToken(userId, transactionId);

  if (!validation.approved) {
    return {
      success: false,
      reason: `Refund validation failed: ${validation.reason}`,
    };
  }

  return {
    success: true,
    refundId: `ref_${Date.now()}`,
    originalTransaction: transactionId,
    amount,
  };
}

module.exports = { processRefund };
