const { Order } = require("../models");
const locationService = require("../services/location.service");

const getAgentLocation = async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { userId, role, restaurantId } = req.user;
    if (role === "user") {
      const order = await Order.findOne({ where: { id: orderId, userId } });
      if (!order) {
        const err = new Error("Order not found");
        err.status = 404;
        throw err;
      }
      if (!order.assignedAgentId) {
        return res.status(200).json({ success: true, data: null });
      }
    } else if (role === "restaurant_admin" || role === "kitchen_staff") {
      const order = await Order.findOne({
        where: { id: orderId, restaurantId },
      });
      if (!order) {
        const err = new Error("Order not found");
        err.status = 404;
        throw err;
      }
    }
    const location = await locationService.getLocationByOrder(orderId);
    res.status(200).json({ success: true, data: location });
  } catch (err) {
    next(err)
  }
};

module.exports={getAgentLocation}