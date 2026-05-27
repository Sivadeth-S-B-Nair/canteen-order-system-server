const sequelize = require("../config/db");
const User = require("./User");
const RefreshToken = require("./RefreshToken");
const MenuItem = require("./MenuItem");
const Order = require("./Order");
const OrderItem = require("./OrderItem");
const MenuItemImage = require("./MenuItemImage");
const Payment = require("./Payment");
const Rating = require("./Rating");
const Restaurant = require("./Restaurant");
const UserProfile = require("./UserProfile");
const UserAddress = require("./UserAddress");
const PromoCode = require("./PromoCode");
const PromoUsage = require("./PromoUsage");
const RefundRequest = require("./RefundRequest");

Restaurant.hasMany(User, { foreignKey: "restaurant_id", as: "staff" });
User.belongsTo(Restaurant, { foreignKey: "restaurant_id", as: "restaurant" });

Restaurant.hasMany(MenuItem, {
  foreignKey: "restaurant_id",
  as: "menuItems",
  onDelete: "CASCADE",
});
MenuItem.belongsTo(Restaurant, {
  foreignKey: "restaurant_id",
  as: "restaurant",
});

Restaurant.hasMany(Order, { foreignKey: "restaurant_id", as: "orders" });
Order.belongsTo(Restaurant, { foreignKey: "restaurant_id", as: "restaurant" });

// A user can have many active sessions (refresh tokens)
User.hasMany(RefreshToken, {
  foreignKey: "user_id",
  as: "refreshTokens",
  onDelete: "CASCADE",
});
RefreshToken.belongsTo(User, { foreignKey: "user_id", as: "user" });

// A user can have many orders
User.hasMany(Order, { foreignKey: "user_id", as: "orders" });
Order.belongsTo(User, { foreignKey: "user_id", as: "user" });

// A order can have many items
Order.hasMany(OrderItem, { foreignKey: "order_id", as: "orderItems" });
OrderItem.belongsTo(Order, { foreignKey: "order_id", as: "order" });

// MenuItem <> OrderItem (soft — no cascade, intentional)
MenuItem.hasMany(OrderItem, { foreignKey: "menu_item_id", as: "orderItems" });
OrderItem.belongsTo(MenuItem, { foreignKey: "menu_item_id", as: "menuItem" });

MenuItem.hasMany(MenuItemImage, {
  foreignKey: "menu_item_id",
  as: "images",
  onDelete: "CASCADE",
});
MenuItemImage.belongsTo(MenuItem, {
  foreignKey: "menu_item_id",
  as: "menuItem",
});

Order.hasOne(Payment, {
  foreignKey: "order_id",
  as: "payment",
  onDelete: "CASCADE",
});
Payment.belongsTo(Order, { foreignKey: "order_id", as: "order" });

User.hasMany(Rating, { foreignKey: "user_id", as: "ratings" });
Rating.belongsTo(User, { foreignKey: "user_id", as: "user" });

Order.hasMany(Rating, { foreignKey: "order_id", as: "ratings" });
Rating.belongsTo(Order, { foreignKey: "order_id", as: "order" });

MenuItem.hasMany(Rating, { foreignKey: "menu_item_id", as: "ratings" });
Rating.belongsTo(MenuItem, { foreignKey: "menu_item_id", as: "menuItem" });

User.hasOne(UserProfile, {
  foreignKey: "user_id",
  as: "profile",
  onDelete: "CASCADE",
});
UserProfile.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(UserAddress, {
  foreignKey: "user_id",
  as: "addresses",
  onDelete: "CASCADE",
});
UserAddress.belongsTo(User, { foreignKey: "user_id", as: "user" });

PromoCode.hasMany(PromoUsage, { foreignKey: "promo_code_id", as: "usages" });
PromoUsage.belongsTo(PromoCode, {
  foreignKey: "promo_code_id",
  as: "promoCode",
});

User.hasMany(PromoUsage, { foreignKey: "user_id", as: "promoUsages" });
Order.hasOne(PromoUsage, { foreignKey: "order_id", as: "promoUsage" });

Restaurant.hasMany(PromoCode, {
  foreignKey: "restaurant_id",
  as: "promoCodes",
});
PromoCode.belongsTo(Restaurant, {
  foreignKey: "restaurant_id",
  as: "restaurant",
});

Order.hasOne(RefundRequest, {
  foreignKey: "order_id",
  as: "refundRequest",
  onDelete: "CASCADE",
});
RefundRequest.belongsTo(Order, { foreignKey: "order_id", as: "order" });

User.hasMany(RefundRequest, {
  foreignKey: "user_id",
  as: "refundRequests",
});
RefundRequest.belongsTo(User, { foreignKey: "user_id", as: "user" });

// reviewedBy is also a User, but it's a different association (the admin).
// We use a separate alias to avoid collision with the user association above.
RefundRequest.belongsTo(User, {
  foreignKey: "reviewed_by",
  as: "reviewer",
});
module.exports = {
  sequelize,
  Restaurant,
  User,
  RefreshToken,
  MenuItem,
  Order,
  OrderItem,
  MenuItemImage,
  Payment,
  Rating,
  UserProfile,
  UserAddress,
  PromoCode,
  PromoUsage,
  RefundRequest,
};
