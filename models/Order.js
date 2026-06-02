const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Order = sequelize.define(
  "Order",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    restaurantId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    promoCodeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    assignedAgentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    estimatedDeliveryTime: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    status: {
      type: DataTypes.ENUM(
        "PAYMENT_PENDING",
        "CONFIRMED",
        "Cooking",
        "Ready",
        "Out for Delivery",
        "Delivered",
        "Picked Up",
        "CANCELLED",
      ),
      defaultValue: "PAYMENT_PENDING",
    },
    deliveryType: {
      type: DataTypes.ENUM("dine_in", "delivery"),
      allowNull: false,
      defaultValue: "dine_in",
    },
    deliveryAddressId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    specialInstructions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cookingStartedAt: {
      type: DataTypes.DATE,
    },
    readyAt: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "orders",
    underscored: true, // Magically maps userId (JS) to user_id (DB)
  },
);

module.exports = Order;
