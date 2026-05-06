const {DataTypes}=require("sequelize")
const sequelize = require("../config/db");

const MenuItemImage=sequelize.define("MenuItemImage",{
    menuItemId:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    imageUrl:{
        type:DataTypes.STRING(2048),
        allowNull:false
    },
    displayOrder:{
        type:DataTypes.INTEGER,
        defaultValue:0
    }
},
{
    tableName:"menu_item_images",
    underscored:true
})

module.exports=MenuItemImage