const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PromoCode = sequelize.define('PromoCode', {
  restaurantId: {
    type: DataTypes.INTEGER,
    allowNull: true,  // null = platform-wide
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    // Store uppercase always — validation also uppercases input
    // so "save10" and "SAVE10" are the same code
    set(val) { this.setDataValue('code', val.toUpperCase().trim()); },
  },
  discountType: {
    type: DataTypes.ENUM('percentage', 'fixed'),
    allowNull: false,
  },
  discountValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  minOrderAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: null,
  },
  maxDiscountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: null,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
  usageLimit: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
  usedCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'promo_codes',
  underscored: true,
});

module.exports = PromoCode;