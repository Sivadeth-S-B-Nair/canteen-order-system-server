const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserProfile = sequelize.define(
  'UserProfile',
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    avatarUrl: {
      type: DataTypes.STRING(2048),
      allowNull: true,
    },
  },
  {
    tableName: 'user_profiles',
    underscored: true,
  },
);

module.exports = UserProfile;