module.exports=(err,req,res,next)=>{
    if(process.env.NODE_ENV==="development"){
        console.error(err.stack);
    }
    res.status(err.status||500).json({
        success:false,
        message:err.message||"Internal server error"
    })
}