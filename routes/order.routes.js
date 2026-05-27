const express=require("express")
const router=express.Router()
const orderController=require("../controllers/order.controller")
const refundController=require("../controllers/refund.controller")
const {protect,verifyKitchenStaff, verifyRestaurantAdmin}=require("../middlewares/authMiddleware")

router.post("/",protect,orderController.createOrder)
router.get("/user",protect,orderController.getUserOrders)
router.get("/all",protect,verifyKitchenStaff,orderController.getAllActiveOrders)
router.patch("/:id/status",protect,verifyKitchenStaff,orderController.updateOrderStatus)
router.post("/:id/cancel",protect,refundController.cancelOrder)

module.exports=router   