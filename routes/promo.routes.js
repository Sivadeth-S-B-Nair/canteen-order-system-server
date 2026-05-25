const express=require("express")
const router=express.Router()
const promoController=require("../controllers/promo.controller")
const {protect,verifyRestaurantAdmin}=require("../middlewares/authMiddleware")

router.post("/validate",protect,promoController.validatePromo)

router.get("/",protect,verifyRestaurantAdmin,promoController.listPromos)
router.post("/",protect,verifyRestaurantAdmin,promoController.createPromo)
router.put("/:id",protect,verifyRestaurantAdmin,promoController.updatePromo)
router.patch("/:id/toggle",protect,verifyRestaurantAdmin,promoController.togglePromo)
router.get("/:id/usage",protect,verifyRestaurantAdmin,promoController.getPromoUsageHistory)

module.exports=router