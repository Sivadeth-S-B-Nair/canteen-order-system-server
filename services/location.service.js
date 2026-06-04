const { AgentLocation, Order, User } = require("../models");
const sequelize = require("../config/db");

const upsertLocation = async (agentId, orderId, latitude, longitude) => {
  if (latitude < -90 || latitude > 90) {
    const err = new Error(`Invalide latitude: ${latitude}`);
    err.status = 400;
    throw err;
  }
  if (longitude < -180 || longitude > 180) {
    const err = new Error(`Invalid longitude: ${longitude}`);
    err.status = 400;
    throw err;
  }

  await sequelize.query(
    `INSERT INTO agent_locations (agent_id,order_id,latitude,longitude,updated_at) VALUES (:agentId,:orderId,:latitude,:longitude,NOW()) ON DUPLICATE KEY UPDATE order_id=VALUES(order_id), latitude=VALUES(latitude), longitude=VALUES(longitude), updated_at=NOW()`,
    {
        replacements:{agentId,orderId:orderId??null,latitude,longitude},        
        type:sequelize.QueryTypes.INSERT
    }
  );
  return {agentId,orderId,latitude,longitude,updatedAt:new Date()}
};


const getLocationByOrder = async (orderId) => {
  const location = await AgentLocation.findOne({
    where: { orderId },
    include: [
      { model: User, as: 'agent', attributes: ['id', 'name'] },
    ],
  });
 
  if (!location) return null;
 
  return {
    agentId: location.agentId,
    agentName: location.agent?.name ?? null,
    latitude: parseFloat(location.latitude),
    longitude: parseFloat(location.longitude),
    updatedAt: location.updatedAt,
  };
};
 
const getLocationByAgent = async (agentId) => {
  const location = await AgentLocation.findOne({ where: { agentId } });
  if (!location) return null;
  return {
    latitude: parseFloat(location.latitude),
    longitude: parseFloat(location.longitude),
    orderId: location.orderId,
    updatedAt: location.updatedAt,
  };
};
 
module.exports = { upsertLocation, getLocationByOrder, getLocationByAgent };        