const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { protect, verifySuperAdmin } = require("../middlewares/authMiddleware");

router.post(
  "/restaurants",
  protect,
  verifySuperAdmin,
  adminController.createRestaurant,
);
router.get(
  "/restaurants",
  protect,
  verifySuperAdmin,
  adminController.listRestaurants,
);
router.post(
  "/restaurant-admins",
  protect,
  verifySuperAdmin,
  adminController.createRestaurantAdmin,
);
router.get(
  "/restaurants/:id/summary",
  protect,
  verifySuperAdmin,
  adminController.getRestaurantSummary,
);
router.get("/users",protect,verifySuperAdmin,adminController.listUsers)
router.get("/users/:userId/orders",protect,verifySuperAdmin,adminController.getUserOrdersAsAdmin)

module.exports = router;
