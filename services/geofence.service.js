const turf = require("@turf/turf");

// Radius around the customer's door that counts as "nearby" (metres).
const CUSTOMER_RADIUS_M = 100;

// How many consecutive seconds the agent must spend inside the customer
// geofence before we auto-suggest "Delivered".
const DWELL_THRESHOLD_MS = 30_000; // 30 seconds

// In-memory dwell state
// Key: `${agentId}:${orderId}`
// Value: { enteredAt: Date }
const dwellMap = new Map();

const isWithinRadius = (
  pointLat,
  pointLng,
  centreLat,
  centreLng,
  radiusMetres,
) => {
  const point = turf.point([pointLng, pointLat]);
  const centre = turf.point([centreLng, centreLat]);
  const distanceKm = turf.distance(point, centre, { units: "kilometers" });
  return distanceKm * 1000 <= radiusMetres;
};

// Called on every `location-update` socket event.
// returns {{
// nearCustomer:  boolean,   // agent is inside the 100 m customer geofence
// dwellTriggered: boolean,  // agent has been inside for 30+ seconds
const checkGeofences = ({
  agentId,
  orderId,
  latitude,
  longitude,
  deliveryAddress,
}) => {
  const result = { nearCustomer: false, dwellTriggered: false };

  const hasDestCoords =
    deliveryAddress &&
    deliveryAddress.latitude !== null &&
    deliveryAddress.longitude !== null;

  if (hasDestCoords) {
    const destLat = parseFloat(deliveryAddress.latitude);
    const destLng = parseFloat(deliveryAddress.longitude);

    result.nearCustomer = isWithinRadius(
      latitude,
      longitude,
      destLat,
      destLng,
      CUSTOMER_RADIUS_M,
    );

    const dwellKey = `${agentId}:${orderId}`;
    
    if (result.nearCustomer) {
      if (!dwellMap.has(dwellKey)) {
        dwellMap.set(dwellKey, { enteredAt: Date.now() });
      } else {
        const { enteredAt } = dwellMap.get(dwellKey);
        if (Date.now() - enteredAt >= DWELL_THRESHOLD_MS) {
          result.dwellTriggered = true;
        }
      }
    }
    else{
        // Agent left the geofence — reset dwell timer.
        dwellMap.delete(dwellKey)
    }
  }
  return result
};
//Call this when an order reaches "Delivered" or "CANCELLED".
const clearDwellState=(agentId,orderId)=>{
 dwellMap.delete(`${agentId}:${orderId}`)
}

module.exports={checkGeofences,clearDwellState,CUSTOMER_RADIUS_M,DWELL_THRESHOLD_MS}