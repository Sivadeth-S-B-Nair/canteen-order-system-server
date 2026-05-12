const {DataTypes}=require("sequelize")
const sequelize=require("../config/db")

const Restaurant=sequelize.define("Restaurant",{
    name:{
        type:DataTypes.STRING,
        allowNull:false,
        validate:{
            notEmpty:{ msg: "Restaurant name cannot be empty" }
        },
    },
    location:{
        type:DataTypes.STRING,
        allowNull:true,
    },
    isActive:{
        type:DataTypes.BOOLEAN,
        defaultValue:true,
        allowNull:false
    },
},
{
    tableName:"restaurants",
    underscored:true
})

module.exports=Restaurant