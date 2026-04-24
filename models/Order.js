const {DataTypes}=require('sequelize')
const sequelize=require('../config/db')

const Order=sequelize.define("Order",{
      userId:{
        type:DataTypes.INTEGER,
        allowNull:false,
        references:{model:"users",key:"id"},
        onUpdate:'CASCADE',
        onDelete:'CASCADE'
      },
      totalPrice:{
        type:DataTypes.DECIMAL(10,2),
        allowNull:false
      },
      status:{
        type:DataTypes.ENUM('Ordered','Cooking','Ready','Picked Up'),
        defaultValue:'Ordered'
      },
      cookingStartedAt:{
        type:DataTypes.DATE,
      },
      readyAt:{
        type:DataTypes.DATE
      },
},
{
  tableName: 'orders',
  underscored: true,           // Magically maps userId (JS) to user_id (DB)
}
)

module.exports=Order