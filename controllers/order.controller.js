const orderService=require("../services/order.service")

const createOrder=async(req,res,next)=>{
    try{
        const order=await orderService.createOrder(req.user.userId,req.body.items)
        res.status(201).json({
            success:true,
            data:order
        })
    }
    catch(err){
        next(err)
    }
}

const getUserOrders=async(req,res,next)=>{
    try{
        const orders=await orderService.getUserOrders(req.user.userId)
        res.status(200).json({
            success:true,
            data:orders
        })
    }
    catch(err){
        next(err)
    }
}

const getAllActiveOrders=async(req,res,next)=>{
    try{
        const orders=await orderService.getAllActiveOrders()
        res.status(200).json({
            success:true,
            data:orders
        })
    }
    catch(err){
        next(err)
    }
}

const updateOrderStatus=async(req,res,next)=>{
    try{
        const order=await orderService.updateOrderStatus(req.params.id,req.body.status)
        res.status(200).json({
            success:true,
            data:order
        })
    }
    catch(err){
        next(err)
    }
}

module.exports={createOrder,getUserOrders,getAllActiveOrders,updateOrderStatus}