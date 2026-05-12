const { json } = require("sequelize")
const adminService=require("../services/admin.service")

const createRestaurant=async(req,res,next)=>{
    try{
        const {name,location}=req.body
        if(!name){
            const err=new Error("Restaurant name is required")
            err.status=400
            throw err
        }
        const restaurant=await adminService.createRestaurant({name,location})
        res.status(201).json({success:true,data:restaurant})
    }
    catch(err){
        next(err)
    }
}

const createRestaurantAdmin=async(req,res,next)=>{
    try{
        const {name,email,password,restaurantId}=req.body
        if(!name||!email||!password||!restaurantId){
            const err=new Error("name, email, password, and restaurantId are required")
            err.status=400
            throw err
        }
        const user=await adminService.createRestaurantAdmin({name,email,password,restaurantId})
        res.status(201).json({success:true,data:user})
    }
    catch(err){
        next(err)
    }
}

const listRestaurants=async(req,res,next)=>{
    try{
        const restaurants=await adminService.listRestaurants(false)
        res.status(200).json({success:true,data:restaurants})
    }
    catch(err){
        next(err)
    }
}

module.exports={createRestaurant,createRestaurantAdmin,listRestaurants}