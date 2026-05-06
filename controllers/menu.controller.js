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
        const imageUrls=(req.files||[]).map((file)=>`/uploads/menu-items/${file.filename}`)
        const primaryImageUrl=imageUrls[0]||""
        const item=await menuService.addMenuItem({...req.body,imageUrl:primaryImageUrl,imageUrls})
        res.status(201).json({
            success:true,
            data:item
        })
    }
    catch(err){
        if(err.code==="LIMIT_FILE_SIZE"){
            return res.status(400).json({ success: false, message: 'Each image must be under 5 MB' })
        }
        if(err.code==="LIMIT_FILE_COUNT"){
            return res.status(400).json({ success: false, message: 'Maximum 10 images allowed' })
        }
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