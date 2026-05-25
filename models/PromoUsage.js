const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PromoUsage = sequelize.define('PromoUsage', {
  promoCodeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Snapshot of actual discount — important because promo might be edited later
  discountApplied: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
}, {
  tableName: 'promo_usages',
  underscored: true,
  indexes: [
    { unique: true, fields: ['promo_code_id', 'order_id'] },
  ],
});

module.exports = PromoUsage;