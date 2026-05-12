const {DataTypes}=require("sequelize")
const sequelize=require("../config/db")

const User=sequelize.define("User",{
    name:{
        type:DataTypes.STRING,
        allowNull:false,
        validate:{notEmpty:{msg:"Name cannot be empty"}}
    },
    email:{
        type:DataTypes.STRING,
        allowNull:false,
        unique:true,
        validate:{isEmail:{msg:'Must be a valid email'}}
    },
    password:{
        type:DataTypes.STRING,
        allowNull:false
    },
    role:{
        type:DataTypes.ENUM('user','super_admin','restaurant_admin','kitchen_staff'),
        defaultValue:'user'
    },
    restaurantId:{
        type:DataTypes.INTEGER,
        allowNull:true
    }
},
{
    tableName:"users",
    underscored: true,        // Magically maps userId (JS) to user_id (DB)
}
)

module.exports=User