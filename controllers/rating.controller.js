const ratingService=require("../services/rating.service")

const submitRating=async(req,res,next)=>{
    try{
        console.log("req.body:",req.body)
        const {orderId,menuItemId,rating,review}=req.body
        console.log("orderId:", orderId, "menuItemId:", menuItemId) 
        const userId=req.user.userId
        const result=await ratingService.submitRating(userId,orderId,menuItemId,rating,review)
        res.status(201).json({
            success:true,
            data:result
        })
    }
    catch(err){
        next(err)
    }
}

const getItemRatings=async(req,res,next)=>{
    try{
        const result=await ratingService.getItemRatings(req.params.menuItemId)
        res.status(200).json({
            success:true,
            data:result
        })
    }
    catch(err){
        next(err)
    }
}

const getOrderRatingStatus=async(req,res,next)=>{
    try{
        const result= await ratingService.getOrderRatingStatus(req.user.userId,req.params.orderId)
        res.status(200).json({
            success:true,
            data:result
        })
    }
    catch(err){
        next(err)
    }
}

module.exports={submitRating,getItemRatings,getOrderRatingStatus}