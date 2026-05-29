const paymentService = require("../services/payment.service");
const { getIO } = require("../socket");

const listPayments = async (req, res, next) => {
  try {
    if (req.user.role === 'user') {
        const err = new Error("Forbidden: Admins only");
        err.status = 403;
        throw err;
    }
    const { page, limit } = req.query;
    const result = await paymentService.listPayments(req.user.role, req.user.restaurantId, page, limit);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

const getPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentByOrder(req.params.orderId);
    if (!payment) {
      const err = new Error("Payment not found");
      err.status = 404;
      throw err;
    }
    res.status(200).json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};

const initiatePayment = async (req, res, next) => {
  try {
    const data = await paymentService.initiatePayment(req.params.orderId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const verifyAndConfirmPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      const err = new Error(
        "razorpayOrderId, razorpayPaymentId, and razorpaySignature are required",
      );
      err.status=400;
      throw err;
    }
    const result = await paymentService.verifyAndConfirmPayment(
      req.params.orderId,
      { razorpayOrderId, razorpayPaymentId, razorpaySignature },
    );
    if (result.success && result.order) {
      getIO()
        .to(`kitchen-${result.order.restaurantId}-room`)
        .emit("new-order", result.order);
      getIO()
        .to(`user-${result.order.userId}-room`)
        .emit("order-updated", result.order);
    }
    res.status(200).json({
      success: true,
      data: {
        paymentSuccess: result.success,
        payment: result.payment,
        order: result.order,
      },
    });
  } catch (err) {
    next(err);
  }
};

const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    if (!signature) {
      return res
        .status(400)
        .json({ success: false, message: "Missing Signature" });
    }
    const rawBody = req.body.toString("utf8");
    const result = await paymentService.handleWebhook(rawBody, signature);
    if (result.handled && result.success && result.order) {
      getIO()
        .to(`kitchen-${result.order.restaurantId}-room`)
        .emit("new-order", result.order);
      getIO()
        .to(`user-${result.order.userId}-room`)
        .emit("order-updated", result.order);
    }
    res.status(200).json({
      success: true,
    });
  } catch (err) {
    console.error("[Webhook Error]", err.message);
    res.status(200).json({ success: false, message: err.message });
  }
};

const retryPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.resetFailedPayment(req.params.orderId);
    res.status(200).json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPayment,
  initiatePayment,
  verifyAndConfirmPayment,
  handleWebhook,
  retryPayment,
  listPayments
};
