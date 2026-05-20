const { Op, QueryTypes } = require("sequelize");
const sequelize = require("../config/db");

const COMMISSION_RATE = 0.1;

function getStartDate(range) {
  const now = new Date();
  switch (range) {
    case "7d":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    case "30d":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    case "ytd":
      return new Date(now.getFullYear(), 0, 1);
    default:
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  }
}

async function getRevenueTrend(range, restaurantId = null) {
  const startDate = getStartDate(range);
  const startStr = startDate.toISOString().slice(0, 10);

  const restaurantFilter = restaurantId
    ? `AND o.restaurant_id = ${parseInt(restaurantId, 10)}`
    : "";

  const rows = await sequelize.query(
    `
    WITH RECURSIVE date_series AS (
  SELECT DATE(:startDate) AS day
  UNION ALL
  SELECT DATE_ADD(day, INTERVAL 1 DAY)
  FROM date_series
  WHERE day <= CURDATE()
    )
    SELECT
  ds.day AS date,
  COALESCE(SUM(filtered_payments.amount), 0) AS grossRevenue,
  COUNT(filtered_payments.id) AS orderCount,
  COALESCE(SUM(filtered_payments.amount), 0) * :commissionRate AS commission
    FROM date_series ds
    LEFT JOIN (
  SELECT p.id, p.amount, DATE(p.paid_at) as paid_date
  FROM payments p
  JOIN orders o ON p.order_id = o.id
  WHERE p.status = 'PAID' 
  ${restaurantFilter}
    ) AS filtered_payments ON filtered_payments.paid_date = ds.day
    GROUP BY ds.day
    ORDER BY ds.day ASC;
    `,
    {
      replacements: { startDate: startStr, commissionRate: COMMISSION_RATE },
      type: QueryTypes.SELECT,
    },
  );
  return rows.map((row) => ({
    date: row.date,
    grossRevenue: parseFloat(row.grossRevenue) || 0,
    commission: parseFloat(row.commission) || 0,
    orderCount: parseInt(row.orderCount, 10) || 0,
  }));
}

async function getPlatformSummary(range, restaurantId=null) {
  const startDate = getStartDate(range);
  //   const startStr = startDate.toISOString.slice(0, 10);
  const restaurantFilter = restaurantId
    ? `AND o.restaurant_id = ${parseInt(restaurantId, 10)}`
    : "";

  const [result] = await sequelize.query(
    `
        SELECT COUNT(DISTINCT p.id) as totalOrders,
        COALESCE(SUM(p.amount),0) as grossRevenue,
        COALESCE(SUM(p.amount),0) * :commissionRate as totalCommission,
        COUNT(DISTINCT o.restaurant_id) as activeRestaurants 
        FROM payments p JOIN orders o ON p.order_id=o.id WHERE p.status="PAID" AND p.paid_at>= :startDate ${restaurantFilter}
        `,
    {
      replacements: {
        startDate: startDate.toISOString().slice(0, 10),
        commissionRate: COMMISSION_RATE,
      },
      type: QueryTypes.SELECT,
    },
  );
  return {
    totalOrders: parseInt(result.totalOrders, 10) || 0,
    grossRevenue: parseFloat(result.grossRevenue) || 0,
    totalCommission: parseFloat(result.totalCommission) || 0,
    activeRestaurants: parseInt(result.activeRestaurants, 10) || 0,
  };
}

async function getRevenueByRestaurant(range) {
  const startDate = getStartDate(range);
  const rows = await sequelize.query(
    `
        SELECT r.id  AS restaurantId,
        r.name AS restaurantName,
        COUNT(DISTINCT p.id) AS orderCount,
        COALESCE(SUM(p.amount),0) AS grossRevenue,
        COALESCE(SUM(p.amount),0) * :commissionRate AS commission
        FROM restaurants r
        LEFT JOIN orders o ON o.restaurant_id=r.id
        LEFT JOIN payments p ON p.order_id=o.id
        AND p.status="PAID" AND p.paid_at>= :startDate
        WHERE r.is_active=1 
        GROUP BY r.id,r.name
        ORDER BY grossRevenue DESC  
        `,
    {
      replacements: {
        startDate:startDate.toISOString().slice(0,10),
        commissionRate:COMMISSION_RATE
      },
      type:QueryTypes.SELECT
    },
  );
  return rows.map((row)=>({
    restaurantId:row.restaurantId,
    restaurantName:row.restaurantName,
    orderCount:parseInt(row.orderCount,10)||0,
    grossRevenue:parseFloat(row.grossRevenue)||0,
    commission:parseFloat(row.commission)||0
  }))
}


module.exports={getRevenueTrend,getPlatformSummary,getRevenueByRestaurant}