const restaurantService = require("../services/restaurant.service");

const createKitchenStaff = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      const err = new Error("name, email, and password required");
      err.status = 400;
      throw err;
    }
    const restaurantId = req.user.restaurantId;
    const user = await restaurantService.createKitchenStaff({
      name,
      email,
      password,
      restaurantId,
    });
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const createDeliveryAgent = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      const err = new Error("name, email, and password are required");
      err.status = 400;
      throw err;
    }
    const restaurantId = req.user.restaurantId;
    const user = await restaurantService.createDeliveryAgent({
      name,
      email,
      password,
      restaurantId,
    });
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const listDeliveryAgents = async (req, res, next) => {
  try {
    const agents = await restaurantService.listDeliveryAgents(
      req.user.restaurantId,
    );
    res.status(200).json({ success: true, data: agents });
  } catch (err) {
    next(err);
  }
};

const getPublicRestaurants = async (req, res, next) => {
  try {
    const restaurants = await restaurantService.getPublicRestaurants();
    res.status(200).json({ success: true, data: restaurants });
  } catch (err) {
    next(err);
  }
};

module.exports = { createKitchenStaff, getPublicRestaurants,createDeliveryAgent,listDeliveryAgents };
