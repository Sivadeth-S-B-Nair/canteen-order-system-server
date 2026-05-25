const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Payment = sequelize.define("Payment", {
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("PENDING", "PAID", "FAILED"),
    allowNull: false,
    defaultValue: "PENDING",
  },
  method: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  razorpayOrderId:{
    type:DataTypes.STRING(100),
    allowNull:true,
    defaultValue:null
  },
  razorpayPaymentId:{
    type:DataTypes.STRING(100),
    allowNull:true,
    defaultValue:null
  },
  razorpaySignature:{
    type:DataTypes.STRING(512),
    allowNull:true,
    defaultValue:null
  }
},
{
    tableName:"payments",
    underscored:true
});

module.exports=Payment