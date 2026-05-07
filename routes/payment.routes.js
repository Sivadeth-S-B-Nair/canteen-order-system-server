const express=require("express")
const router=express.Router()
const paymentController=require("../controllers/payment.controller")
const {protect}=require("../middlewares/authMiddleware")

router.get("/:orderId",protect,paymentController.getPayment)
router.post("/:orderId/process",protect,paymentController.proccessPayment)
router.post("/:orderId/retry",protect,paymentController.retryPayment)

module.exports=router