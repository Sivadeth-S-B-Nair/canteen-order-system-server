const { Op } = require("sequelize");
const sequelize = require("../config/db");
const {
  Order,
  OrderItem,
  MenuItem,
  Payment,
  User,
  RefundRequest,
  UserAddress,
} = require("../models");
const emailService = require("./email.service");
const promoService = require("./promo.service");

const VALID_TRANSITIONS = {
  dine_in: {
    CONFIRMED: "Cooking",
    Cooking: "Ready",
    Ready: "Picked Up",
  },
  delivery: {
    CONFIRMED: "Cooking",
    Cooking: "Ready",
    // "Ready → Out for Delivery" is handled separately by assignAgent()
    // because it also sets assignedAgentId and estimatedDeliveryTime.
    "Out for Delivery": "Delivered",
  },
};

// Button labels used by frontend (exported so the UI can stay in sync)
const BUTTON_LABELS = {
  dine_in: {
    CONFIRMED: "Start Cooking",
    Cooking: "Mark Ready",
    Ready: "Mark Picked Up",
  },
  delivery: {
    CONFIRMED: "Start Cooking",
    Cooking: "Mark Ready",
    // "Ready" handled by assign-agent flow, not a simple status button
    "Out for Delivery": "Mark Delivered",
  },
};

const createOrder = async (
  userId,
  {
    items,
    deliveryType = "dine_in",
    deliveryAddressId = null,
    specialInstructions = null,
    promoCode = null,
  },
) => {
  const transaction = await sequelize.transaction();

  try {
    let subTotal = 0;
    let resolvedRestaurantId = null;
    const itemsToCreate = [];

    for (const item of items) {
      const menuItem = await MenuItem.findByPk(item.menuItemId);

      if (!menuItem) {
        const err = new Error(`Menu item ${item.menuItemId} not found`);
        err.status = 400;
        throw err;
      }
      if (!menuItem.isAvailable) {
        const err = new Error(`${menuItem.name} is currently unavailable`);
        err.status = 400;
        throw err;
      }
      if (resolvedRestaurantId === null) {
        resolvedRestaurantId = menuItem.restaurantId;
      } else if (resolvedRestaurantId !== menuItem.restaurantId) {
        const err = new Error(
          "All items in an order must be from the same restaurant",
        );
        err.status = 400;
        throw err;
      }

      const price = parseFloat(menuItem.price);
      subTotal += price * item.qty;

      itemsToCreate.push({
        menuItemId: menuItem.id,
        snapshotName: menuItem.name,
        snapshotPrice: price,
        qty: item.qty,
      });
    }

    let discountAmount = 0;
    let appliedPromoId = null;

    if (promoCode) {
      const { promo, discountAmount: discount } =
        await promoService.validatePromo({
          code: promoCode,
          restaurantId: resolvedRestaurantId,
          userId,
          subTotal,
        });
      discountAmount = discount;
      appliedPromoId = promo.id;
    }

    const totalPrice = parseFloat((subTotal - discountAmount).toFixed(2));

    const order = await Order.create(
      {
        userId,
        restaurantId: resolvedRestaurantId,
        totalPrice,
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        promoCodeId: appliedPromoId,
        status: "PAYMENT_PENDING",
        deliveryType,
        deliveryAddressId,
        specialInstructions,
      },
      { transaction },
    );

    await OrderItem.bulkCreate(
      itemsToCreate.map((i) => ({ ...i, orderId: order.id })),
      { transaction },
    );

    await Payment.create(
      {
        orderId: order.id,
        amount: parseFloat(totalPrice.toFixed(2)),
        status: "PENDING",
      },
      { transaction },
    );

    if (appliedPromoId) {
      await promoService.redeemPromo({
        promoId: appliedPromoId,
        userId,
        orderId: order.id,
        discountAmount,
        t: transaction,
      });
    }

    await transaction.commit();

    return Order.findByPk(order.id, {
      include: [
        { model: OrderItem, as: "orderItems" },
        { model: Payment, as: "payment" },
      ],
    });
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

const getUserOrders = async (userId) => {
  return Order.findAll({
    where: { userId },
    include: [
      { model: OrderItem, as: "orderItems" },
      { model: RefundRequest, as: "refundRequest", required: false },
      {
        model: User,
        as: "assignedAgent",
        attributes: ["id", "name"],
        required: false,
      },
      {
        model: UserAddress,
        as: "deliveryAddress",
        attributes: [
          "id",
          "label",
          "addressLine",
          "city",
          "state",
          "pincode",
          "phone",
          "latitude",
          "longitude",
        ],
        required: false,
      },
    ],

    order: [["createdAt", "DESC"]],
  });
};

const getAllActiveOrders = async (restaurantId) => {
  return Order.findAll({
    where: {
      restaurantId,
      status: { [Op.notIn]: ["PAYMENT_PENDING", "Picked Up"] },
    },
    include: [
      { model: OrderItem, as: "orderItems" },
      {
        model: User,
        as: "assignedAgent",
        attributes: ["id", "name"],
        required: false,
      },
      {
        model: UserAddress,
        as: "deliveryAddress",
        attributes: [
          "id",
          "label",
          "addressLine",
          "city",
          "state",
          "pincode",
          "phone",
          "latitude",
          "longitude",
        ],
        required: false,
      },
    ],
    order: [["createdAt", "ASC"]],
  });
};

const getAgentOrders = async (agentId) => {
  return Order.findAll({
    where: {
      assignedAgentId: agentId,
      status: { [Op.in]: ["Out for Delivery", "Delivered"] },
    },
    include: [
      { model: OrderItem, as: "orderItems" },
      { model: User, as: "user", attributes: ["id", "name"] },
      {
        model: UserAddress,
        as: "deliveryAddress",
        attributes: [
          "id",
          "label",
          "addressLine",
          "city",
          "state",
          "pincode",
          "phone",
          "latitude",
          "longitude",
        ],
        required: false,
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};

const updateOrderStatus = async (orderId, newStatus, restaurantId) => {
  // const validTransitions = {
  //   CONFIRMED: "Cooking",
  //   Cooking: "Ready",
  //   Ready: "Picked Up",
  // };
  const order = await Order.findOne({
    where: { id: orderId, restaurantId },
    include: [{ model: User, as: "user" }],
  });
  if (!order) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }

  const trasitionMap =
    VALID_TRANSITIONS[order.deliveryType] || VALID_TRANSITIONS.dine_in;
  const expectedNext = trasitionMap[order.status];

  if (expectedNext !== newStatus) {
    const err = new Error(
      `Cannot move "${order.deliveryType}" order from "${order.status}" to "${newStatus}".` +
        (expectedNext
          ? ` Expected next status: "${expectedNext}".`
          : ` No further transitions defined from "${order.status}".`),
    );
    err.status = 400;
    throw err;
  }

  // if (validTransitions[order.status] !== newStatus) {
  //   const err = new Error(
  //     `Cannot move from "${order.status}" to "${newStatus}". Expected: "${validTransitions[order.status]}"`,
  //   );
  //   err.status = 400;
  //   throw err;
  // }

  const updateData = { status: newStatus };
  let emailSent = false;
  if (newStatus === "Cooking") updateData.cookingStartedAt = new Date();
  if (newStatus === "Ready") {
    updateData.readyAt = new Date();
    try {
      emailSent = await emailService.sendOrderReadyEmail({
        email: order.user.email,
        name: order.user.name,
        orderId: order.id,
      });
    } catch (error) {
      console.error(
        `[Email Error] Failed to send ready email for Order ${order.id}`,
      );
      emailSent = false;
    }
  }

  await order.update(updateData);
  const updatedOrder = await Order.findByPk(orderId, {
    include: [{ model: OrderItem, as: "orderItems" }],
  });
  return { order: updatedOrder, emailSent };
};

const updateAgentOrderStatus = async (orderId, newStatus, agentId) => {
  const order = await Order.findOne({
    where: { id: orderId, assignedAgentId: agentId },
    include: [{ model: User, as: "user" }],
  });
  if (!order) {
    const err = new Error("Order not found or not assigned to you");
    err.status = 404;
    throw err;
  }
  if (order.status !== "Out for Delivery" || newStatus !== "Delivered") {
    const err = new Error(
      `Delivery agents can only mark "Out for Delivery" orders as "Delivered". ` +
        `Current status: "${order.status}".`,
    );
    err.status = 400;
    throw err;
  }
  await order.update({ status: "Delivered" });
  const updatedOrder = await Order.findByPk(orderId, {
    include: [{ model: OrderItem, as: "orderItems" }],
  });
  return { order: updatedOrder };
};

const assignAgent = async ({
  orderId,
  restaurantId,
  agentId,
  estimatedDeliveryTime = null,
}) => {
  const order = await Order.findOne({
    where: { id: orderId, restaurantId },
  });
  if (!order) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }
  if (order.status !== "Ready") {
    const err = new Error(
      `Can only assign an agent to a "Ready" order. Current status: "${order.status}".`,
    );
    err.status = 400;
    throw err;
  }
  if (order.deliveryType !== "delivery") {
    const err = new Error(
      "Can only assign a delivery agent to delivery orders.",
    );
    err.status = 400;
    throw err;
  }

  // Verify the agent belongs to this restaurant
  const agent = await User.findOne({
    where: { id: agentId, restaurantId, role: "delivery_agent" },
  });
  if (!agent) {
    const err = new Error(
      "Delivery agent not found or does not belong to this restaurant.",
    );
    err.status = 404;
    throw err;
  }

  await order.update({
    assignedAgentId: agentId,
    estimatedDeliveryTime: estimatedDeliveryTime || null,
    status: "Out for Delivery",
  });

  const updatedOrder = await Order.findByPk(orderId, {
    include: [
      { model: OrderItem, as: "orderItems" },
      { model: User, as: "assignedAgent", attributes: ["id", "name"] },
    ],
  });
  return { order: updatedOrder, agent };
};

module.exports = {
  createOrder,
  getUserOrders,
  getAllActiveOrders,
  updateOrderStatus,
  updateAgentOrderStatus,
  assignAgent,
  getAgentOrders,
  VALID_TRANSITIONS,
  BUTTON_LABELS,
};
