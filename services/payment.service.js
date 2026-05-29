const Razorpay = require("razorpay");
const crypto = require("crypto");
const { Payment, Order, OrderItem, sequelize, Restaurant } = require("../models");

const listPayments = async (role, restaurantId, page = 1, limit = 20) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const orderWhere = {};
  if (role === "restaurant_admin" || role === "kitchen_staff") {
    if (!restaurantId) throw new Error("Restaurant ID required");
    orderWhere.restaurantId = restaurantId;
  }

  const { rows, count } = await Payment.findAndCountAll({
    include: [
      {
        model: Order,
        as: "order",
        where: Object.keys(orderWhere).length ? orderWhere : undefined,
        required: true,
        include: [
          { model: Restaurant, as: "restaurant", attributes: ["id", "name"] }
        ]
      }
    ],
    order: [["createdAt", "DESC"]],
    limit: limitNum,
    offset,
  });

  return {
    data: rows,
    total: count,
    page: pageNum,
    totalPages: Math.ceil(count / limitNum),
  };
};

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createRazerpayOrder = async (internalOrderId, amountInRupees) => {
  const options = {
    amount: Math.round(parseFloat(amountInRupees) * 100), //paise
    currency: "INR",
    receipt: `order_${internalOrderId}`,
    payment_capture: 1, //auto-capture (no manual capture needed)
  };
  return razorpay.orders.create(options);
};

const verifyRazorpaySignature = (
  razorpayOrderId,
  razorpayPaymentId,
  signature,
) => {
  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "hex"),
    Buffer.from(signature, "hex"),
  );
};

const initiatePayment = async (internalOrderId) => {
  const payment = await Payment.findOne({
    where: { orderId: internalOrderId },
  });
  if (!payment) {
    const err = new Error("Payment record not found for this order");
    err.status = 404;
    throw err;
  }
  if (payment.status === "PAID") {
    const err = new Error("This order has already been paid");
    err.status = 400;
    throw err;
  }
  const order = await Order.findByPk(internalOrderId);
  if (!order) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }
  if (order.status !== "PAYMENT_PENDING") {
    const err = new Error("Order is not awaiting payment");
    err.status = 400;
    throw err;
  }

  // await new Promise((resolve) => setTimeout(resolve, 3000));
  // const success = Math.random() < 0.8;

  if (payment.razorpayOrderId) {
    return {
      razorpayOrderId: payment.razorpayOrderId,
      amount: payment.amount,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  }

  const rzpOrder = await createRazerpayOrder(internalOrderId, payment.amount);
  await payment.update({ razorpayOrderId: rzpOrder.id });

  return {
    razorpayOrderId: rzpOrder.id,
    amount: payment.amount,
    currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID,
  };

};

const verifyAndConfirmPayment = async (
  internalOrderId,
  { razorpayOrderId, razorpayPaymentId, razorpaySignature },
) => {
  const payment = await Payment.findOne({
    where: { orderId: internalOrderId },
  });
  if (!payment) {
    const err = new Error("Payment record not found");
    err.status = 404;
    throw err;
  }
  if (payment.status === "PAID") {
    const order = await Order.findByPk(internalOrderId, {
      include: [{ model: OrderItem, as: "orderItems" }],
    });
    return { success: true, payment: payment.toJSON(), order };
  }
  let isValid = false;
  try {
    isValid = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );
  } catch (err) {
    isValid = false;
  }
  if (!isValid) {
    await payment.update({ status: "FAILED", razorpayPaymentId });
    const err = new Error("Payment verification failed - signature mismatch");
    err.status = 400;
    throw err;
  }
  const t = await sequelize.transaction();
  try {
    await payment.update(
      {
        status: "PAID",
        razorpayPaymentId,
        razorpaySignature,
        transactionId: razorpayOrderId,
        paidAt: new Date(),
      },
      {
        transaction: t,
      },
    );
    await Order.update(
      { status: "CONFIRMED" },
      { where: { id: internalOrderId }, transaction: t },
    );
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }
  const updatedOrder = await Order.findByPk(internalOrderId, {
    include: [{ model: OrderItem, as: "orderItems" }],
  });
  return { success: true, payment: payment.toJSON(), order: updatedOrder };
};

// ─── handleWebhook ────────────────────────────────────────────────────────────
// Razorpay can also call your server directly on payment events.
// This is a server-to-server call so the frontend is not involved.

const handleWebhook = async (rawBody, signature) => {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  const isValid = crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "hex"),
    Buffer.from(signature, "hex"),
  );
  if (!isValid) {
    const err = new Error("Invalid webhook signature");
    err.status = 400;
    throw err;
  }
  const event = JSON.parse(rawBody);
  const eventType = event.event;
  const paymentEntity = event.payload?.payment?.entity;
  if (!paymentEntity) {
    return { handled: false };
  }
  const razorpayOrderId = paymentEntity.order_id;
  const razorpayPaymentId = paymentEntity.id;
  const payment = await Payment.findOne({ where: { razorpayOrderId } });
  if (!payment) {
    return { handled: false };
  }
  if (eventType == "payment.captured" && payment.status !== "PAID") {
    const t = await sequelize.transaction();
    try {
      await payment.update(
        { status: "PAID", razorpayPaymentId, transactionId: razorpayOrderId },
        { transaction: t },
      );
      await Order.update(
        { status: "CONFIRMED" },
        { where: { id: payment.orderId }, transaction: t },
      );
      await t.commit()
    } catch (err) {
      await t.rollback()
      throw err
    }
    const order= await Order.findByPk(payment.orderId,{
      include:[{model:OrderItem, as:"orderItems"}]
    })
    return {handled:true,success:true,order}
  }
  if(eventType==="payment.failed" && payment.status==="PENDING"){
    await payment.update({status:"FAILED",razorpayPaymentId})
    return{handled:true,success:false}
  }
  return {handled:false}
};

const getPaymentByOrder = async (orderId) => {
  return Payment.findOne({ where: { orderId } });
};

const resetFailedPayment = async (orderId) => {
  const payment = await Payment.findOne({ where: { orderId } });

  if (!payment) {
    const err = new Error("Payment not found");
    err.status = 404;
    throw err;
  }
  if (payment.status !== "FAILED") {
    const err = new Error("Only failed payments can be retried");
    err.status = 400;
    throw err;
  }
  await payment.update({
    status: "PENDING",
    method: null,
    transactionId: null,
    razorpayOrderId:null,
    razorpayPaymentId:null,
    razorpaySignature:null,
    paidAt: null,
  });
  return payment;
};

module.exports = {
  initiatePayment,
  verifyAndConfirmPayment,
  handleWebhook,
  getPaymentByOrder,
  resetFailedPayment,
  listPayments  
};
