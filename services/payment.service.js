const { Payment, Order, OrderItem } = require("../models");

const createPayment = async (orderId, amount) => {
  return Payment.create({ orderId, amount, status: "PENDING" });
};

const processPayment = async (orderId, method) => {
  const payment = await Payment.findOne({ where: { orderId } });
  if (!payment) {
    const err = new Error("Payment record not found for this order");
    err.status = 404;
    throw err;
  }
  if (payment.status === "PAID") {
    const err = new Error("This order has already been paid");
    err.status = 400;
    throw err;
  }
  const order = await Order.findByPk(orderId, {
    include: [{ model: OrderItem, as: "orderItems" }],
  });
  if (!order) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }
  if (order.status !== "PAYMENT_PENDING") {
    const err = new Error("Order is not awaiting payment");
    err.status = 400;
    throw err;
  }

  await new Promise((resolve) => setTimeout(resolve, 3000));
  const success = Math.random() < 0.8;

  const { sequelize } = require("../models");
  const t = await sequelize.transaction();
  try {
    if (success) {
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      await payment.update(
        { status: "PAID", method, transactionId, paidAt: new Date() },
        { transaction: t },
      );
      await order.update({ status: "CONFIRMED" }, { transaction: t });
      await t.commit();

      const updatedOrder=await Order.findByPk(orderId,{include:[{model:OrderItem,as:"orderItems"}]})
      
      return {success:true,payment:payment.toJSON(),order:updatedOrder}
    }
    else{
        await payment.update({status:"FAILED",method},{transaction:t})
        await t.commit()
        return {success:false,payment:payment.toJSON(),order}
    }
  } catch (err) {
    await t.rollback()
    throw err
  }
};

const getPaymentByOrder=async(orderId)=>{
    return Payment.findOne({where:{orderId}})
}

const resetFailedPayment=async(orderId)=>{
    const payment=await Payment.findOne({where:{orderId}})

    if(!payment){
        const err=new Error("Payment not found")
        err.status=404
        throw err
    }
    if(payment.status!=="FAILED"){
        const err=new Error("Only failed payments can be retried")
        err.status=400
        throw err
    }
    await payment.update({status:"PENDING",method:null,transactionId:null,paidAt:null})
    return payment
}

module.exports={createPayment,processPayment,getPaymentByOrder,resetFailedPayment}