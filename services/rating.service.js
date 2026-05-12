const { Order, OrderItem, Rating } = require("../models");

const submitRating = async (userId, orderId, menuItemId, rating, review) => {
  const order = await Order.findOne({ where: { id: orderId, userId } });
  if (!order) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }
  if (order.status !== "Picked Up") {
    const err = new Error(
      "You can only rate an order after it has been picked up",
    );
    err.status = 400;
    throw err;
  }
  const wasOrdered = await OrderItem.findOne({
    where: { orderId, menuItemId },
  });
  if (!wasOrdered) {
    const err = new Error("This item was not part of the order");
    err.status = 400;
    throw err;
  }

  try {
    const newRating =await Rating.create({
      userId,
      orderId,
      menuItemId,
      rating,
      review,
    });
    return newRating;
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      const e = new Error("You have already rated this item in this order");
      e.status = 409;
      throw e;
    }
    throw err;
  }
};

const getItemRatings = async (menuItemId) => {
  const result = await Rating.findAll({
    where: { menuItemId },
    attributes: ["rating", "review", "createdAt"],
    order: [["createdAt", "DESC"]],
  });

  const count = result.length;
  const average =
    count === 0 ? null : result.reduce((sum, r) => sum + r.rating, 0) / count;
  return {
    menuItemId,
    averageRating: average ? parseFloat(average.toFixed(1)) : null,
    totalRatings: count,
    ratings: result,
  };
};

const getOrderRatingStatus = async (userId, orderId) => {
  const order = await Order.findOne({
    where: { id: orderId, userId },
    include: [{ model: OrderItem, as: "orderItems" }],
  });
  if(!order){
    const err=new Error("Order not found")
    err.status=404
    throw err
  }
  const existingRatings=await Rating.findAll({where:{userId,orderId}})
  const ratedItemIds=new Set(existingRatings.map((r)=>r.menuItemId))

  return{
    id:orderId,
    canRate:order.status==="Picked Up",
    items:order.orderItems.map((item)=>({
        menuItemId:item.menuItemId,
        snapshotName:item.snapshotName,
        isRated:ratedItemIds.has(item.menuItemId)
    }))
  }
};

module.exports={submitRating,getItemRatings,getOrderRatingStatus}