const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');



const AgentLocation = sequelize.define(
  'AgentLocation',
  {
    agentId: {
      type: DataTypes.INTEGER,
      primaryKey: true,  
      allowNull: false,
    },

    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },

    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
    },

    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
    },
  },
  {
    tableName: 'agent_locations',
    underscored: true,

    createdAt: false,
    updatedAt: 'updatedAt', 
  },
);

module.exports = AgentLocation