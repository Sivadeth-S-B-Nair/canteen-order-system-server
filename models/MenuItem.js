const {DataTypes}=require('sequelize')
const sequelize=require('../config/db')

const MenuItem=sequelize.define("MenuItem",{
    name:{
        type:DataTypes.STRING,
        allowNull:false
      },
      description:{
        type:DataTypes.TEXT,
        allowNull:false,
      },
      price:{
        type:DataTypes.DECIMAL(10,2),
        allowNull:false
      },
      category:{
        type:DataTypes.STRING,
        allowNull:false
      },
      imageUrl:{
        type:DataTypes.STRING,
      },
      isAvailable:{
        type:DataTypes.BOOLEAN,
        defaultValue:true
      },
},
{
  tableName: 'menu_items', 
  underscored: true,           // Magically maps userId (JS) to user_id (DB)
}
)

module.exports=MenuItem