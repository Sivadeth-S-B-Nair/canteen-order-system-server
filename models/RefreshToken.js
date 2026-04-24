const {DataTypes}=require('sequelize')
const sequelize=require('../config/db')

const RefreshToken=sequelize.define("RefreshToken",{
    token:{
        type:DataTypes.TEXT,
        allowNull:false
      },
      userId:{
        type:DataTypes.INTEGER,
        allowNull:false,
      },
      userAgent: {
        type:DataTypes.STRING,   // "which browser/device"
        allowNull:true
      },
      expiresAt:{
        type:DataTypes.DATE,
        allowNull:false
      },
},
{
  tableName:"refresh_tokens",
  underscored: true,        // Magically maps userId (JS) to user_id (DB)
}
)

module.exports=RefreshToken