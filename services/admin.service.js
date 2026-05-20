const bcrypt = require("bcryptjs");
const { Restaurant, User, Order,OrderItem } = require("../models");
const emailService=require("./email.service")
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

  const emailSent=await emailService.sendRestaurantAdminCredentials({name,email,password,restaurantName:restaurant.name})

  const {password:_p,...safeUser}=user.toJSON()
  return {user:safeUser,emailSent}
};
const listRestaurants=async(activeOnly=false)=>{
    const where=activeOnly?{isActive:true}:{}
    return Restaurant.findAll({where,order:[["name","ASC"]]})
}

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
      { replacements: { id }, type: QueryTypes.SELECT }
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
      menuCount:    parseInt(raw.menuCount, 10)      || 0,
      staffCount:   parseInt(raw.staffCount, 10)     || 0,
      orderCount:   parseInt(raw.orderCount, 10)     || 0,
      totalRevenue: parseFloat(raw.totalRevenue)     || 0,
    },
    staff,
    recentOrders,
  };
};
 

module.exports={createRestaurant,createRestaurantAdmin,listRestaurants,getRestaurantSummary}