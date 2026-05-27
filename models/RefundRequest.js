const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');


const RefundRequest = sequelize.define(
  'RefundRequest',
  {
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // one refund request per order
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    refundAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },

    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    reviewedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },

    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },

    razorpayRefundId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },

    razorpayRefundStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: 'refund_requests',
    underscored: true,
  },
);

module.exports = RefundRequest;