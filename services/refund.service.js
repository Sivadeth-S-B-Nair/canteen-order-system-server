const Razorpay = require('razorpay');
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const { Order, OrderItem, Payment, RefundRequest, User } = require('../models');
const emailService = require('./email.service');

let razorpay;
const getRazorpay = () => {
  if (!razorpay) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
};

const cancelOrder = async (userId, orderId, cancellationReason = null) => {
  const order = await Order.findOne({
    where: { id: orderId, userId },
    include: [
      { model: Payment, as: 'payment' },
      { model: User, as: 'user' },
    ],
  });

  if (!order) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }

  const CANCELLABLE_STATUSES = ['PAYMENT_PENDING', 'CONFIRMED'];
  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    const err = new Error(
      `Orders in "${order.status}" status cannot be cancelled. ` +
        'You can only cancel orders that have not started preparation.',
    );
    err.status = 400;
    throw err;
  }

  const existing = await RefundRequest.findOne({ where: { orderId } });
  if (existing) {
    const err = new Error('A cancellation request already exists for this order');
    err.status = 409;
    throw err;
  }

  const wasAlreadyPaid = order.payment?.status === 'PAID';

  const t = await sequelize.transaction();
  try {
    await order.update({ status: 'CANCELLED' }, { transaction: t });

    let refundRequest = null;

    if (wasAlreadyPaid) {
      refundRequest = await RefundRequest.create(
        {
          orderId: order.id,
          userId,
          refundAmount: parseFloat(order.totalPrice),
          status: 'PENDING',
          cancellationReason: cancellationReason || null,
        },
        { transaction: t },
      );
    }

    await t.commit();

    try {
      await emailService.sendOrderCancellationEmail({
        email: order.user.email,
        name: order.user.name,
        orderId: order.id,
        refundAmount: wasAlreadyPaid ? parseFloat(order.totalPrice) : null,
      });
    } catch (emailErr) {
      console.error(`[Email] Failed to send cancellation email for order ${order.id}:`, emailErr.message);
    }

    const updatedOrder = await Order.findByPk(order.id, {
      include: [
        { model: OrderItem, as: 'orderItems' },
        { model: RefundRequest, as: 'refundRequest' },
      ],
    });

    return { order: updatedOrder, refundRequest };
  } catch (err) {
    await t.rollback();
    throw err;
  }
};


const listRefundRequests = async ({ restaurantId, status = null, page = 1, limit = 20 }) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const where = {};
  if (status) where.status = status;

  const { rows, count } = await RefundRequest.findAndCountAll({
    where,
    include: [
      {
        model: Order,
        as: 'order',
        where: { restaurantId }, 
        required: true,
        include: [{ model: OrderItem, as: 'orderItems' }],
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email'],
      },
      {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'name'],
        required: false, 
      },
    ],
    order: [
      [sequelize.literal(`FIELD(RefundRequest.status, 'PENDING', 'APPROVED', 'REJECTED')`), 'ASC'],
      ['createdAt', 'DESC'],
    ],
    limit: limitNum,
    offset,
    distinct: true,
  });

  return {
    data: rows,
    total: count,
    page: pageNum,
    totalPages: Math.ceil(count / limitNum),
  };
};

const getUserRefundRequests = async (userId) => {
  return RefundRequest.findAll({
    where: { userId },
    include: [
      {
        model: Order,
        as: 'order',
        include: [{ model: OrderItem, as: 'orderItems' }],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
};

const reviewRefundRequest = async ({
  refundRequestId,
  restaurantId,
  adminUserId,
  decision, 
  adminNotes = null,
}) => {
  if (!['APPROVED', 'REJECTED'].includes(decision)) {
    const err = new Error('decision must be APPROVED or REJECTED');
    err.status = 400;
    throw err;
  }

  if (decision === 'REJECTED' && (!adminNotes || !adminNotes.trim())) {
    const err = new Error('admin_notes (reason) is required when rejecting a refund request');
    err.status = 400;
    throw err;
  }

  const refundRequest = await RefundRequest.findOne({
    where: { id: refundRequestId, status: 'PENDING' },
    include: [
      {
        model: Order,
        as: 'order',
        where: { restaurantId },
        required: true,
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email'],
      },
    ],
  });

  if (!refundRequest) {
    const err = new Error('Refund request not found, already reviewed, or does not belong to your restaurant');
    err.status = 404;
    throw err;
  }

  const now = new Date();
  let razorpayRefundId = null;
  let razorpayRefundStatus = null;

  if (decision === 'APPROVED') {

    const payment = await Payment.findOne({ where: { orderId: refundRequest.orderId } });

    if (payment?.razorpayPaymentId) {
      try {
        const rzpRefund = await getRazorpay().payments.refund(
          payment.razorpayPaymentId,
          {
            amount: Math.round(parseFloat(refundRequest.refundAmount) * 100), 
            speed: 'normal', // 'normal' = 5-7 business days
            notes: {
              reason: adminNotes || 'Customer cancellation',
              order_id: String(refundRequest.orderId),
            },
          },
        );
        razorpayRefundId = rzpRefund.id;
        razorpayRefundStatus = rzpRefund.status;
      } catch (razorpayErr) {
        console.error(
          `[Razorpay] Refund API call failed for RefundRequest ${refundRequestId}:`,
          razorpayErr.message,
        );
        razorpayRefundStatus = 'API_FAILED'; 
      }
    } else {
      // No razorpayPaymentId means the payment wasn't through Razorpay,
      // or the payment record is missing. Mark for manual processing.
      razorpayRefundStatus = 'MANUAL_REQUIRED';
    }
  }

  // Persist the decision.
  await refundRequest.update({
    status: decision,
    adminNotes: adminNotes || null,
    reviewedBy: adminUserId,
    reviewedAt: now,
    razorpayRefundId,
    razorpayRefundStatus,
  });

  try {
    await emailService.sendRefundStatusEmail({
      email: refundRequest.user.email,
      name: refundRequest.user.name,
      orderId: refundRequest.orderId,
      refundAmount: parseFloat(refundRequest.refundAmount),
      decision,
      adminNotes: decision === 'REJECTED' ? adminNotes : null,
      razorpayRefundId,
    });
  } catch (emailErr) {
    console.error(`[Email] Failed to send refund status email:`, emailErr.message);
  }

  return RefundRequest.findByPk(refundRequest.id, {
    include: [
      {
        model: Order,
        as: 'order',
        include: [{ model: OrderItem, as: 'orderItems' }],
      },
      { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
      { model: User, as: 'reviewer', attributes: ['id', 'name'] },
    ],
  });
};

const getRefundRequestByOrder = async (orderId, userId) => {
  const refundRequest = await RefundRequest.findOne({
    where: { orderId, userId },
    include: [
      {
        model: Order,
        as: 'order',
        include: [{ model: OrderItem, as: 'orderItems' }],
      },
    ],
  });

  if (!refundRequest) {
    const err = new Error('No refund request found for this order');
    err.status = 404;
    throw err;
  }

  return refundRequest;
};

module.exports = {
  cancelOrder,
  listRefundRequests,
  getUserRefundRequests,
  reviewRefundRequest,
  getRefundRequestByOrder,
};