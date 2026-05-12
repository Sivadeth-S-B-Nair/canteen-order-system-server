const express=require("express")
const router=express.Router()
const orderController=require("../controllers/order.controller")
const {protect,verifyKitchenStaff}=require("../middlewares/authMiddleware")

router.post("/",protect,orderController.createOrder)
router.get("/user",protect,orderController.getUserOrders)
router.get("/all",protect,verifyKitchenStaff,orderController.getAllActiveOrders)
router.patch("/:id/status",protect,verifyKitchenStaff,orderController.updateOrderStatus)

module.exports=router   