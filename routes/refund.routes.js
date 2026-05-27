const express = require("express");
const router = express.Router();
const refundController = require("../controllers/refund.controller");
const {
  protect,
  verifyRestaurantAdmin,
} = require("../middlewares/authMiddleware");

router.get("/my", protect, refundController.getUserRefundRequests);

router.get(
  "/order/:orderId",
  protect,
  refundController.getRefundRequestByOrder,
);
router.get(
  "/",
  protect,
  verifyRestaurantAdmin,
  refundController.listRefundRequests,
);

router.post(
  "/:id/review",
  protect,
  verifyRestaurantAdmin,
  refundController.reviewRefundRequest,
);

module.exports = router;
