const paymentService = require("../services/payment.service")
const {getIO}=require("../socket")

const getPayment=async(req,res,next)=>{
    try{
        const payment=await paymentService.getPaymentByOrder(req.params.orderId)
        if(!payment){
            const err=new Error("Payment not found")
            err.status=404
            throw err
        }
        res.status(200).json({success:true,data:payment})
    }
    catch(err){
        next(err)
    }
}

const proccessPayment=async(req,res,next)=>{
    try{
        const {method}=req.body
        const {orderId}=req.params
        if(!method){
            const err=new Error("Payment method is required")
            err.status=400
            throw err
        }
        const result=await paymentService.processPayment(orderId,method)

        if(result.success){
            getIO().to(`kitchen-${result.order.restaurantId}-room`).emit("new-order",result.order)
            getIO().to(`user-${result.order.userId}-room`).emit("order-updated",result.order)
        }
        res.status(200).json({
            success:true,
            data:{
                paymentSuccess:result.success,
                payment:result.payment,
                order:result.order
            }
        })
        
    }
    catch(err){
        next(err)
    }
}

const retryPayment=async(req,res,next)=>{
    try{
        const payment=await paymentService.resetFailedPayment(req.params.orderId)
        res.status(200).json({success:true,data:payment})
    }
    catch(err){
        next(err)
    }
}

module.exports={getPayment,proccessPayment,retryPayment}