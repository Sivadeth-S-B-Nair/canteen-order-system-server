const analyticsService = require("../services/analytics.service");

const VALID_RANGES = ["7d", "30d", "ytd"];

const getRevenueTrend = async (req, res, next) => {
  try {
    const range = VALID_RANGES.includes(req.query.range)
      ? req.query.range
      : "7d";
    const restaurantId = req.query.restaurantId
      ? parseInt(req.query.restaurantId, 10)
      : null;

    const data = await analyticsService.getRevenueTrend(range, restaurantId);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const getPlatformSummary = async (req, res, next) => {
  try {
    const range = VALID_RANGES.includes(req.query.range)
      ? req.query.range
      : "7d";
    const restaurantId = req.query.restaurantId
      ? parseInt(req.query.restaurantId, 10)
      : null;

    const data = await analyticsService.getPlatformSummary(range, restaurantId);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const getRevenueByRestaurant = async (req, res, next) => {
  try {
    const range = VALID_RANGES.includes(req.query.range)
      ? req.query.range
      : "7d";

    const data = await analyticsService.getRevenueByRestaurant(range);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports={getRevenueTrend,getPlatformSummary,getRevenueByRestaurant}
