const orderService = require("../services/order.service");
const { getIO } = require("../socket");

const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(
      req.user.userId,
      req.body.items,
    );
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

const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await orderService.updateOrderStatus(
      req.params.id,
      req.body.status,
      req.user.restaurantId
    );
    //ADDED: emit to the specific user's room after status changes
    // Only that user gets notified — not everyone
    getIO().to(`user-${order.userId}-room`).emit("order-updated", order);
    getIO().to(`kitchen-${order.restaurantId}-room`).emit("order-updated", order);
    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getAllActiveOrders,
  updateOrderStatus,
};
