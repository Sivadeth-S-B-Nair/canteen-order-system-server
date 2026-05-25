const express=require("express")
const router=express.Router()
const paymentController=require("../controllers/payment.controller")
const {protect}=require("../middlewares/authMiddleware")

router.post("/webhook",express.raw({type:"application/json"}),paymentController.handleWebhook)

router.get("/:orderId",express.json(),protect,paymentController.getPayment)
router.post("/:orderId/initiate",express.json(),protect,paymentController.initiatePayment)
router.post("/:orderId/verify",express.json(),protect,paymentController.verifyAndConfirmPayment)
router.post("/:orderId/retry",express.json(),protect,paymentController.retryPayment)

module.exports=router