const express = require("express");
const router = express.Router();
const restaurantController = require("../controllers/restaurant.controller");
const {
  verifyRestaurantAdmin,
  protect,
} = require("../middlewares/authMiddleware");

router.post(
  "/staff",
  protect,
  verifyRestaurantAdmin,
  restaurantController.createKitchenStaff,
);

router.post(
  "/delivery-agent",
  protect,
  verifyRestaurantAdmin,
  restaurantController.createDeliveryAgent,
);

router.get(
  "/delivery-agents",
  protect,
  verifyRestaurantAdmin,
  restaurantController.listDeliveryAgents,
);

module.exports = router;
