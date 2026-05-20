const express=require("express")
const router=express.Router()
const analyticsController=require("../controllers/analytics.controller")
const {protect,verifySuperAdmin}=require("../middlewares/authMiddleware")

router.get("/summary",protect,verifySuperAdmin,analyticsController.getPlatformSummary)
router.get("/revenue-trend",protect,verifySuperAdmin,analyticsController.getRevenueTrend)
router.get("/by-restaurant",protect,verifySuperAdmin,analyticsController.getRevenueByRestaurant)

module.exports=router