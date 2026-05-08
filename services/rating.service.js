const { Order, OrderItem, Rating } = require("../models")

const submitRating=async(userId,orderId,menuItemId,rating,review)=>{
    const order= await Order.findOne({where:{id:orderId,userId}})
    if(!order){
        const err=new Error("Order not found")
        err.status=404
        throw err
    }
    if(order.status!=="Picked Up"){
        const err=new Error("You can only rate an order after it has been picked up")
        err.status=400
        throw err
    }
    const wasOrdered=await OrderItem.findOne({where:{orderId,menuItemId}})   
    if(!wasOrdered){
        const err=new Error("This item was not part of the order")
        err.status=400
        throw err
    }

    try{
        const newRating=Rating.create({userId,orderId,menuItemId,rating,review})
        return newRating
    }
    catch(err){
        if(err.name==="SequelizeUniqueConstraintError"){
            
        }
    }
}