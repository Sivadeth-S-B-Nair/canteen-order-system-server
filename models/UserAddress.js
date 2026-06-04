const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserAddress = sequelize.define(
  'UserAddress',
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    label: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Home',
    },
    addressLine: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    pincode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
      defaultValue: null,
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: 'user_addresses',
    underscored: true,
  },
);

module.exports = UserAddress;