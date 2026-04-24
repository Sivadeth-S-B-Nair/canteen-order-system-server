const menuService=require("../services/menu.service")

const getMenuItems=async(req,res,next)=>{
    try{
        const items=await menuService.getMenuItems(req.user.role)
        res.status(200).json({
            success:true,
            data:items
        })
    }
    catch(err){
        next(err)
    }
}

const addMenuItem=async(req,res,next)=>{
    try{
        const item=await menuService.addMenuItem(req.body)
        res.status(201).json({
            success:true,
            data:item
        })
    }
    catch(err){
        next(err)
    }
}

const toggleAvailability=async(req,res,next)=>{
    try{
        const item=await menuService.toggleAvailability(req.params.id)
        res.status(200).json({
            success:true,
            data:item
        })
    }
    catch(err){
        next(err)
    }
}

module.exports={getMenuItems,addMenuItem,toggleAvailability}