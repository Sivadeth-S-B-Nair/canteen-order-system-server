const {DataTypes}=require("sequelize")
const sequelize=require("../config/db")

const OrderItem=sequelize.define("OrderItem",{
    orderId:{
        type:DataTypes.INTEGER,
        allowNull:false,
        references:{model:'orders',key:'id'},
        onUpdate:"CASCADE",
        onDelete:"CASCADE"
      },
      menuItemId:{
        type:DataTypes.INTEGER,
        allowNull:true
      },
      snapshotName:{
        type:DataTypes.STRING,
        allowNull:false
      },
      snapshotPrice:{
        type:DataTypes.DECIMAL(10.2),
        allowNull:false
      },
      qty:{
        type:DataTypes.INTEGER,
        allowNull:false,
        defaultValue:1
      },
},
{
  tableName: 'order_items',
  underscored: true,           // Magically maps userId (JS) to user_id (DB)
}
)

module.exports=OrderItem