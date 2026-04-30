const authService=require("../services/auth.service")
const tokenService=require("../services/token.service")
const {COOKIE_OPTIONS}=require("../services/token.service")

const register=async(req,res,next)=>{
    try{
        const {name,email,password,role}=req.body

        const existing=await authService.findUserByEmail(email)
        if(existing){
            const err=new Error("Email already registered")
            err.status=409
            throw err
        }

         const user=await authService.createUser(name,email,password,role)   
         res.status(201).json({
            success:true,
            message:"Registered Successfully",
            data:user
         })
    }
    catch(err){
        next(err)
    }
}

const login=async(req,res,next)=>{
    try{
        const {email,password}=req.body
        const userAgent = req.headers['user-agent']
        const user=await authService.findUserByEmail(email)
        if(!user){
            const err=new Error("Invalid email or password")
            err.status=401
            throw err
        }
        const isMatch=await authService.validatePassword(password,user.password)
        if(!isMatch){
            const err=new Error("Invalid email or password")
            err.status=401
            throw err
        }

        const accessToken=tokenService.generateAccessToken(user.id,user.role)
        const refreshToken=tokenService.generateRefreshToken(user.id,user.role)

        await tokenService.saveRefreshToken(user.id,refreshToken,userAgent)

        res.cookie("refreshToken",refreshToken,COOKIE_OPTIONS)
        res.status(200).json({
            success:true,
            message:"Login successfull",
            accessToken,
            user:{id:user.id,name:user.name,email:user.email,role:user.role}
        })
    }
    catch(err){
        next(err)
    }
}

const refresh=async(req,res,next)=>{
    try{
        const refreshToken=req.cookies.refreshToken
        if(!refreshToken){
            const err=new Error("Refresh token required")
            err.status=401
            throw err
        }
        const tokenInDb=await tokenService.findRefreshToken(refreshToken)
        if(!tokenInDb){
            const err=new Error("Refresh token not recognised")
            err.status=401
            throw err
        }

        const decoded=tokenService.verifyRefreshToken(refreshToken)

        const user=await authService.findUserById(decoded.userId)
        if(!user){
            const err=new Error("User not found")
            err.status=401
            throw err
        }

        const newAccessToken=tokenService.generateAccessToken(user.id,user.role)
        const newRefreshToken=tokenService.generateRefreshToken(user.id,user.role)

        await tokenService.rotateRefreshToken(refreshToken,newRefreshToken)

        res.cookie("refreshToken",newRefreshToken,COOKIE_OPTIONS)
        res.status(200).json({
            success:true,
            accessToken:newAccessToken,
            user:{id:user.id,name:user.name,email:user.email,role:user.role}
        })
    }
    catch(err){
        next(err)
    }
}

const logout=async(req,res,next)=>{
    try{
        const refreshToken=req.cookies.refreshToken
        if(!refreshToken){
            const err=new Error("Refresh token required")
            err.status=400
            throw err
        }
        await tokenService.deleteRefreshToken(refreshToken)
        
        res.clearCookie("refreshToken",COOKIE_OPTIONS)
        res.status(200).json({
            success:true,
            message:"Logout Successfull"
        })
    }
    catch(err){
        next(err)
    }
}

// const logoutAll = async (req, res, next) => {
//   try {
    // req.user is set by protect middleware
//     await tokenService.deleteAllUserTokens(req.user.userId)

//     res.clearCookie('refreshToken', COOKIE_OPTIONS)
//     res.status(200).json({ success: true, message: 'Logged out from all devices' })
//   } catch (err) {
//     next(err)
//   }
// }

module.exports={register,login,refresh,logout}