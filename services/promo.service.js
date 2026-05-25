const { Op } = require("sequelize");
const sequelize = require("../config/db");
const { PromoCode, PromoUsage } = require("../models");

// Compute discount

const computeDiscount = (promo, subTotal) => {
  let discount = 0;

  if (promo.discountType === "percentage") {
    discount = subTotal * (parseFloat(promo.discountValue) / 100);
    if (promo.maxDiscountAmount !== null) {
      discount = Math.min(discount, parseFloat(promo.maxDiscountAmount));
    }
  } else {
    discount = Math.min(parseFloat(promo.discountValue), subTotal);
  }
  return parseFloat(discount.toFixed(2));
};

// Validate promo

const validatePromo = async ({ code, restaurantId, userId, subTotal }) => {
  const upperCode = code.toUpperCase().trim();

  const promo = await PromoCode.findOne({
    where: {
      code: upperCode,
      isActive: true,
      [Op.or]: [{ restaurantId }, { restaurantId: null }],
    },
  });

  if (!promo) {
    const err = new Error("Invalid promo code");
    err.status = 404;
    throw err;
  }

  // Expiry check
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    const err = new Error("This promo code has expired");
    err.status = 400;
    throw err;
  }

  // Usage limit check
  if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
    const err = new Error("This promo code has reached its usage limit");
    err.status = 400;
    throw err;
  }

  // Minimum order amount check
  if (
    promo.minOrderAmount !== null &&
    subTotal < parseFloat(promo.minOrderAmount)
  ) {
    const err = new Error(
      `Mininum order amount of ₹${parseFloat(promo.minOrderAmount).toFixed(2)} required for this code`,
    );
    err.status = 400;
    throw err;
  }

  // Per-user usage check
  const alreadyUsed = await PromoUsage.findOne({
    where: { promoCodeId: promo.id, userId },
  });
  if (alreadyUsed) {
    const err = new Error("You have already used this promo code");
    err.status = 400;
    throw err;
  }

  const discountAmount = computeDiscount(promo, subTotal);
  return { promo, discountAmount };
};

// Redeem Promo

// called inside the createOrder transaction after the order is created.
// created a PromoUsage record and increments usedCount atomically.

const redeemPromo = async ({ promoId, userId, orderId, discountAmount, t }) => {
  await PromoUsage.create(
    { promoCodeId: promoId, userId, orderId, discountApplied: discountAmount },
    { transaction: t },
  );

  await PromoCode.increment("usedCount", {
    by: 1,
    where: { id: promoId },
    transaction: t,
  });
};

// Admin CRUD

const listPromos = async (restaurantId) => {
  return PromoCode.findAll({
    where: { [Op.or]: [{ restaurantId }, { restaurantId: null }] },
    order: [["createdAt", "DESC"]],
  });
};

const createPromo = async (data) => {
  return PromoCode.create({
    ...data,
    code: data.code,
  });
};

const updatePromo = async (id, restaurantId, updates) => {
  const promo =await PromoCode.findOne({
    where: {
      id,
      [Op.or]: [{ restaurantId }, { restaurantId: null }],
    },
  });
  if (!promo) {
    const err = new Error("Promo code not found");
    err.status = 404;
    throw err;
  }
  await promo.update(updates);
  return promo;
};

const togglePromo = async (id, restaurantId) => {
  return updatePromo(id, restaurantId, {});
};

const getPromoUsageHistory = async (promoId, restaurantId) => {
  const promo =await PromoCode.findOne({
    where: { id: promoId, [Op.or]: [{ restaurantId }, { restaurantId: null }] },
  });
  if (!promo) {
    const err = new Error("Promo code not found");
    err.status = 404;
    throw err;
  }
  return PromoUsage.findAll({
    where: { promoCodeId: promoId },
    order: [["createdAt", "DESC"]],
    limit: 100,
  });
};

module.exports = {
  validatePromo,
  redeemPromo,
  computeDiscount,
  listPromos,
  createPromo,
  updatePromo,
  togglePromo,
  getPromoUsageHistory,
};
