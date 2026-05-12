const express=require("express")
const router=express.Router()
const menuController=require("../controllers/menu.controller")
const {protect,verifyRestaurantAdmin,verifyKitchenStaff}=require("../middlewares/authMiddleware")
const upload = require("../middlewares/upload")

router.get("/",protect,menuController.getMenuItems)
router.post("/",protect,verifyRestaurantAdmin,upload.array("images",10),menuController.addMenuItem)
router.patch("/:id/toggle",protect,verifyRestaurantAdmin,menuController.toggleAvailability)

module.exports=router

