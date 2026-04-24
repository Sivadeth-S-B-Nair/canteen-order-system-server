const express=require("express")
const router=express.Router()
const orderController=require("../controllers/order.controller")
const {protect,kitchenOnly}=require("../middlewares/authMiddleware")

router.post("/",protect,orderController.createOrder)
router.get("/user",protect,orderController.getUserOrders)
router.get("/all",protect,kitchenOnly,orderController.getAllActiveOrders)
router.patch("/:id/status",protect,kitchenOnly,orderController.updateOrderStatus)

module.exports=router   