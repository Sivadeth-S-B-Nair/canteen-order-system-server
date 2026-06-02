const bcrypt = require("bcryptjs");
const { User, Restaurant } = require("../models");

const createKitchenStaff = async ({ name, email, password, restaurantId }) => {
  const restaurant = await Restaurant.findByPk(restaurantId);
  if (!restaurant) {
    const err = new Error(`Restaurant with id ${restaurantId} not found`);
    err.status = 404;
    throw err;
  }
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    const err = new Error("Email already registered");
    err.status = 409;
    throw err;
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "kitchen_staff",
    restaurantId,
  });
  const { password: _p, ...safeUser } = user.toJSON();
  return safeUser;
};

const createDeliveryAgent = async ({ name, email, password, restaurantId }) => {
  const restaurant = await Restaurant.findByPk(restaurantId);
  if (!restaurant) {
    const err = new Error(`Restaurant with id ${restaurantId} not found`);
    err.status = 404;
    throw err;
  }
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    const err = new Error("Email already registered");
    err.status = 409;
    throw err;
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "delivery_agent",
    restaurantId,
  });
  const { password: _p, ...safeUser } = user.toJSON();
  return safeUser;
};

const listDeliveryAgents = async (restaurantId) => {
  return User.findAll({
    where: { restaurantId, role: "delivery_agent" },
    attributes: ["id", "name", "email", "createdAt"],
    order: [["name", "ASC"]],
  });
};

const getPublicRestaurants = async () => {
  return Restaurant.findAll({
    where: { isActive: true },
    attributes: ["id", "name", "location"],
    order: [["name", "ASC"]],
  });
};

module.exports = { createKitchenStaff, getPublicRestaurants,createDeliveryAgent,listDeliveryAgents };
