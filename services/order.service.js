const {Op}=require("sequelize")
const sequelize=require("../config/db")
const {Order,OrderItem,MenuItem, Payment}=require("../models")

const createOrder=async(userId,items)=>{
    const transaction=await sequelize.transaction()

    try{
        let totalPrice=0
        const resolvedRestaurantId=null
        const itemsToCreate=[]

        for(const item of items){
            const menuItem=await MenuItem.findByPk(item.menuItemId)
            

            if(!menuItem){
                const err= new Error(`Menu item ${item.menuItemId} not found`)
                err.status=400
                throw err
            }
            if(!menuItem.isAvailable){
                const err=new Error(`${menuItem.name} is currently unavailable`)
                err.status=400
                throw err
            }
            if(resolvedRestaurantId===null){
                resolvedRestaurantId=menuItem.restaurantId
            }
            else if(resolvedRestaurantId!==menuItem.resolvedRestaurantId){
                const err=new Error("All items in an order must be from the same restaurant")
                err.status=400
                throw err
            }

            const price=parseFloat(menuItem.price)
            totalPrice+=price*item.qty

            itemsToCreate.push({
                menuItemId:menuItem.id,
                snapshotName:menuItem.name,
                snapshotPrice:price,
                qty:item.qty
            })
        }

        const order=await Order.create({
            userId,
            restaurantId:resolvedRestaurantId,
            totalPrice:parseFloat(totalPrice.toFixed(2)),
            status:"PAYMENT_PENDING"
        },{transaction})

        await OrderItem.bulkCreate(
            itemsToCreate.map(i=>({...i,orderId:order.id})),{transaction}
        )

        await Payment.create({
            orderId:order.id,
            amount:parseFloat(totalPrice.toFixed(2)),
            status:"PENDING"
        },{transaction})

        await transaction.commit()

        return Order.findByPk(order.id,{
            include:[{model:OrderItem, as:"orderItems"},{model:Payment,as:"payment"}]
        })
    }
    catch(err){
        await transaction.rollback()
        throw err
    }
}

const getUserOrders=async(userId)=>{
    return Order.findAll({
        where:{userId},
        include:[{model:OrderItem,as:"orderItems"}],
        order:[['createdAt',"DESC"]]
    })
}

const getAllActiveOrders=async(resolvedRestaurantId)=>{
    return Order.findAll({
        where:{restaurantId,status:{[Op.notIn]:["PAYMENT_PENDING","Picked Up"]}},
        include:[{model:OrderItem,as:"orderItems"}],
        order:[["createdAt","ASC"]]
    })
}

const updateOrderStatus=async(orderId,newStatus,restaurantId)=>{
    const validTransitions={
        "CONFIRMED":"Cooking",
        "Cooking":"Ready",
        "Ready":"Picked Up"
    }
    const order=await Order.findOne({where:{id:orderId,restaurantId}})
    if(!order){
        const err=new Error("Order not found")
        err.status=404
        throw err
    }
    if(validTransitions[order.status]!==newStatus){
        const err=new Error(`Cannot move from "${order.status}" to "${newStatus}". Expected: "${validTransitions[order.status]}"`)
        err.status=400
        throw err
    }

    const updateData={status:newStatus}
    if(newStatus==="Cooking") updateData.cookingStartedAt=new Date()  
    if(newStatus==="Ready") updateData.readyAt=new Date()
    
    await order.update(updateData)       
    return Order.findByPk(orderId,{
        include:[{model:OrderItem,as:"orderItems"}]
    })
}

module.exports={createOrder,getUserOrders,getAllActiveOrders,updateOrderStatus}