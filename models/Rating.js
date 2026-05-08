const {DataTypes}=require("sequelize")
const sequelize=require("../config/db")

const Rating=sequelize.define("Rating",{
    userId:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    orderId:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    menuItemId:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    rating:{
        type:DataTypes.TINYINT.UNSIGNED,
        allowNull:false,
        validate:{
            min:1,
            max:5
        }
    },
    review:{
        type:DataTypes.TEXT,
        allowNull:true
    }
},
{
    tableName:"ratings",
    underscored:true,
    indexes:[
        {unique:true,fields:["user_id","order_id","menu_item_id"]}
    ]
})

module.exports=Rating