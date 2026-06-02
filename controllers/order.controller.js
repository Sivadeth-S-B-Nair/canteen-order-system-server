const orderService = require("../services/order.service");
const { getIO } = require("../socket");

const createOrder = async (req, res, next) => {
  try {
    const {
      items,
      deliveryType,
      deliveryAddressId,
      specialInstructions,
      promoCode,
    } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      const err = new Error("items array are required and cannot be empty");
      err.status = 400;
      throw err;
    }
    const order = await orderService.createOrder(req.user.userId, {
      items,
      deliveryType: deliveryType || null,
      deliveryAddressId: deliveryAddressId || null,
      specialInstructions: specialInstructions || null,
      promoCode: promoCode || null,
    });
    //ADDED: emit to kitchen room after order is saved to DB
    // Kitchen sees new order instantly without refreshing
    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

const getUserOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getUserOrders(req.user.userId);
    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

const getAllActiveOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getAllActiveOrders(req.user.restaurantId);
    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

const getMyDeliveries = async (req, res, next) => {
  try {
    const orders = await orderService.getAgentOrders(req.user.userId);
    res.status(200).json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { order, emailSent } = await orderService.updateOrderStatus(
      req.params.id,
      req.body.status,
      req.user.restaurantId,
    );
    //ADDED: emit to the specific user's room after status changes
    // Only that user gets notified — not everyone
    getIO().to(`user-${order.userId}-room`).emit("order-updated", order);
    getIO()
      .to(`kitchen-${order.restaurantId}-room`)
      .emit("order-updated", order);
    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

const updateAgentDeliveryStatus = async (req, res, next) => {
  try {
    const { order } = await orderService.updateAgentOrderStatus(
      parseInt(req.params.id, 10),
      req.body.status,
      req.user.userId,
    );
    // Notify the customer
    getIO().to(`user-${order.userId}-room`).emit("order-updated", order);
    // Notify the kitchen/admin dashboard
    getIO()
      .to(`kitchen-${order.restaurantId}-room`)
      .emit("order-updated", order);
    // Notify the agent's own room (so multiple tabs/devices stay in sync)
    getIO().to(`agent-${req.user.userId}-room`).emit("order-updated", order);
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

const assignAgent = async (req, res, next) => {
  try {
    const { agentId, estimatedDeliveryTime } = req.body;
    if (!agentId) {
      const err = new Error("agentId is required");
      err.status = 400;
      throw err;
    }
    const { order, agent } = await orderService.assignAgent({
      orderId: parseInt(req.params.id, 10),
      restaurantId: req.user.restaurantId,
      agentId: parseInt(agentId, 10),
      estimatedDeliveryTime: estimatedDeliveryTime || null,
    });
 
    // Notify the customer their order is now out for delivery
    getIO().to(`user-${order.userId}-room`).emit("order-updated", order);
    // Notify the kitchen/admin dashboard
    getIO()
      .to(`kitchen-${order.restaurantId}-room`)
      .emit("order-updated", order);
    // Notify the assigned agent's personal room
    getIO()
      .to(`agent-${agent.id}-room`)
      .emit("new-delivery", order);
 
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getAllActiveOrders,
  updateOrderStatus,
  getMyDeliveries,
  updateAgentDeliveryStatus,
  assignAgent
};
