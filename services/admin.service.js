const bcrypt = require("bcryptjs");
const { Restaurant, User, Order, OrderItem } = require("../models");
const emailService = require("./email.service");
const sequelize = require("../config/db");
const { Op, QueryTypes } = require("sequelize");

const createRestaurant = async ({ name, location }) => {
  return Restaurant.create({ name, location });
};

const createRestaurantAdmin = async ({
  name,
  email,
  password,
  restaurantId,
}) => {
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
    role: "restaurant_admin",
    restaurantId,
  });

  const emailSent = await emailService.sendRestaurantAdminCredentials({
    name,
    email,
    password,
    restaurantName: restaurant.name,
  });

  const { password: _p, ...safeUser } = user.toJSON();
  return { user: safeUser, emailSent };
};
const listRestaurants = async (activeOnly = false) => {
  const where = activeOnly ? { isActive: true } : {};
  return Restaurant.findAll({ where, order: [["name", "ASC"]] });
};

const getRestaurantSummary = async (restaurantId) => {
  const id = parseInt(restaurantId, 10);

  const restaurant = await Restaurant.findByPk(id);
  if (!restaurant) {
    const err = new Error(`Restaurant ${id} not found`);
    err.status = 404;
    throw err;
  }

  const [statsRow, staff, recentOrders] = await Promise.all([
    sequelize.query(
      `
      SELECT
        (SELECT COUNT(*) FROM menu_items
          WHERE restaurant_id = :id AND is_available = 1)    AS menuCount,
 
        (SELECT COUNT(*) FROM users
          WHERE restaurant_id = :id
            AND role IN ('restaurant_admin','kitchen_staff')) AS staffCount,
 
        (SELECT COUNT(*) FROM orders
          WHERE restaurant_id = :id
            AND status NOT IN ('PAYMENT_PENDING'))            AS orderCount,
 
        (SELECT COALESCE(SUM(p.amount), 0)
          FROM payments p
          JOIN orders o ON p.order_id = o.id
          WHERE o.restaurant_id = :id
            AND p.status = 'PAID')                           AS totalRevenue
      `,
      { replacements: { id }, type: QueryTypes.SELECT },
    ),

    // ── Staff list ─────────────────────────────────────────────────────────
    User.findAll({
      where: {
        restaurantId: id,
        role: ["restaurant_admin", "kitchen_staff"],
      },
      attributes: ["id", "name", "email", "role"],
      order: [
        ["role", "ASC"],
        ["name", "ASC"],
      ],
    }),

    Order.findAll({
      where: {
        restaurantId: id,
        status: { [require("sequelize").Op.ne]: "PAYMENT_PENDING" },
      },
      include: [{ model: OrderItem, as: "orderItems" }],
      order: [["createdAt", "DESC"]],
      limit: 5,
    }),
  ]);
  const raw = statsRow[0];

  return {
    restaurant: restaurant.toJSON(),
    stats: {
      menuCount: parseInt(raw.menuCount, 10) || 0,
      staffCount: parseInt(raw.staffCount, 10) || 0,
      orderCount: parseInt(raw.orderCount, 10) || 0,
      totalRevenue: parseFloat(raw.totalRevenue) || 0,
    },
    staff,
    recentOrders,
  };
};

const listUsers = async ({ search = "", page = 1, limit = 20 }) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  // Calculates how many records the database should skip before returning results. 
  // (e.g., Page 2 with a limit of 20 skips the first 20 records).
  const offset = (pageNum - 1) * limitNum;
  const where = search
    ? {
        [Op.or]: [
          { name: { [Op.like]: `${search}%` } },
          { email: { [Op.like]: `${search}%` } },
        ],
      }
    : {};
  const { rows, count } = await User.findAndCountAll({
    where,
    attributes: ["id", "name", "email", "role", "restaurantId", "createdAt"],
    include: [
      {
        model: Restaurant,
        as: "restaurant",
        attributes: ["id", "name"],
        required: false,
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: limitNum,
    offset,
    distinct: true,
  });
  return {
    data: rows,
    total: count,
    page: pageNum,
    totalPages: Math.ceil(count / limitNum),
  };
};

const getUserOrdersAsAdmin= async(userId)=>{
  const user=await User.findByPk(userId,{
    attributes:["id","name","email"]
  })
  if(!user){
    const err=new Error(`User ${userId} not found`)
    err.status=404
    throw err
  }
  const orders=await Order.findAll({
    where:{userId},
    include:[{model:OrderItem,as:"orderItems"}],
    order:[["createdAt","DESC"]]
  })
  return {user,orders}
}

module.exports = {
  createRestaurant,
  createRestaurantAdmin,
  listRestaurants,
  getRestaurantSummary,
  listUsers,
  getUserOrdersAsAdmin
};
