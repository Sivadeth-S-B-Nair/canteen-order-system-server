const promoService = require("../services/promo.service");

const validatePromo = async (req, res, next) => {
  try {
    const { code, restaurantId, subtotal } = req.body;

    if (!code || !restaurantId || subtotal === undefined) {
      const err = new Error("code, restaurantId, and subtotal are required");
      err.status = 400;
      throw err;
    }

    const { promo, discountAmount } = await promoService.validatePromo({
      code,
      restaurantId: parseInt(restaurantId, 10),
      userId: req.user.userId,
      subTotal: parseFloat(subtotal),
    });

    res.status(200).json({
      success: true,
      data: {
        code: promo.code,
        discountType: promo.discountType,
        discountValue: parseFloat(promo.discountValue),
        discountAmount,
        maxDiscountAmount: promo.maxDiscountAmount,
        minOrderAmount: promo.minOrderAmount,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Admin endpoints
const listPromos = async (req, res, next) => {
  try {
    const restaurantId = req.user.restaurantId;
    const promos = await promoService.listPromos(restaurantId);
    res.status(200).json({ success: true, data: promos });
  } catch (err) {
    next(err);
  }
};

const createPromo = async (req, res, next) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      expiresAt,
      usageLimit,
    } = req.body;
    if (!code || !discountType || discountValue === undefined) {
      const err = new Error(
        "code, discountType, and discountValue are required",
      );
      err.status = 400;
      throw err;
    }
    if (!["percentage", "fixed"].includes(discountType)) {
      const err = new Error("discount type must be percentage or fixed");
      err.status = 400;
      throw err;
    }
    if (
      discountType === "percentage" &&
      (discountValue <= 0 || discountValue > 100)
    ) {
      const err = new Error("Percentage discount must be between 1 and 100");
      err.status = 400;
      throw err;
    }
    const promo = await promoService.createPromo({
      code,
      restaurantId: req.user.restaurantId,
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || null,
      maxDiscountAmount: maxDiscountAmount || null,
      expiresAt:expiresAt||null,
      usageLimit:usageLimit||null
    });
    res.status(200).json({
        success:true,
        data:promo
    })
  } catch (err) {
    if(err.name==="SequelizeUniqueConstraintError"){
        const e=new Error("A promo code with this name already exist")
        e.status=409
        throw next(e)
    }
    next(err)
  }
};

const updatePromo=async(req,res,next)=>{
    try{
        const promo=await promoService.updatePromo(req.params.id,req.user.restaurantId,req.body)
        res.status(200).json({
            success:true,
            data:promo
        })
    }
    catch(err){
        next(err)
    }
}

const togglePromo=async(req,res,next)=>{
    try{
        const promo=await promoService.updatePromo(req.params.id,req.user.restaurantId,{})
        await promo.update({isActive:!promo.isActive})
        res.status(200).json({
            success:true,
            data:promo
        })
    }
    catch(err){
        next(err)
    }
}

const getPromoUsageHistory=async(req,res,next)=>{
    try{
        const history=await promoService.getPromoUsageHistory(req.params.id,req.user.restaurantId)
        res.status(200).json({
            success:true,
            data:history
        })
    }
    catch(err){
        next(err)
    }
}

module.exports={validatePromo,listPromos,createPromo,updatePromo,togglePromo,getPromoUsageHistory}