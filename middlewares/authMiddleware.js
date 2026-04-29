const jwt=require("jsonwebtoken")

const protect=(req,res,next)=>{
    const header=req.headers.authorization

    if(!header || !header.startsWith("Bearer")){
        return res.status(401).json({
            success:false,
            message:"Token expired"
        })
    }

    try{
        const token=header.split(' ')[1]
        const decoded=jwt.verify(token,process.env.JWT_ACCESS_SECRET)
        req.user=decoded
        next()
    }
    catch(err){
        // Frontend interceptor listens for this exact message
        if(err.name==="TokenExpiredError"){
            return res.status(401).json({
                success:false,
                message:"Token expired"
            })
        }
        return res.status(401).json({
            success:false,
            message:"Invalid token"
        })
    }
}

const kitchenOnly=(req,res,next)=>{
    if(req.user?.role!="kitchen"){
        return res.status(403).json({
            success:false,
            message:"Kitchen access only"
        })
    }
    next()
}

module.exports={protect,kitchenOnly}