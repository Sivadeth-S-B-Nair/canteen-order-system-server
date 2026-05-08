const express=require("express")
const router=express.Router()
const ratingController=require("../controllers/rating.controller")
const {protect}=require("../middlewares/authMiddleware")

router.post("/",protect,ratingController.submitRating)
router.get("/menu/:menuItemId",protect,ratingController.getItemRatings)
router.get("/order/:orderId/status",protect,ratingController.getOrderRatingStatus)

module.exports=router   