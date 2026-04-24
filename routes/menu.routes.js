const express=require("express")
const router=express.Router()
const menuController=require("../controllers/menu.controller")
const {protect,kitchenOnly}=require("../middlewares/authMiddleware")

router.get("/",protect,menuController.getMenuItems)
router.post("/",protect,kitchenOnly,menuController.addMenuItem)
router.patch("/:id/toggle",protect,kitchenOnly,menuController.toggleAvailability)

module.exports=router

