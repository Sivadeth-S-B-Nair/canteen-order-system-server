const {MenuItem}=require("../models")

const getMenuItems=async(role)=>{
    if(role==="kitchen"){
        return MenuItem.findAll({order:[["category","ASC"]]})
    }
    return MenuItem.findAll({where:{isAvailable:true},order:[["category","ASC"]]})
}

const addMenuItem=async({name,description,price,category,imageUrl})=>{
    const item=await MenuItem.create({name,description,price,category,imageUrl})
    return item
}

const toggleAvailability=async(id)=>{
    const item=await MenuItem.findByPk(id)
    if(!item){
        const err=new Error("Menu item not found")
        err.status=404
        throw err
    }
    await item.update({isAvailable:!item.isAvailable})
    return item
}

module.exports={getMenuItems,addMenuItem,toggleAvailability}
