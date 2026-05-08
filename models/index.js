const sequelize=require('../config/db')
const User=require('./User')
const RefreshToken=require('./RefreshToken')
const MenuItem=require('./MenuItem')
const Order=require('./Order')
const OrderItem=require('./OrderItem')
const MenuItemImage = require('./MenuItemImage')
const Payment = require('./Payment')
const Rating = require('./Rating')

// A user can have many active sessions (refresh tokens)
User.hasMany(RefreshToken,{foreignKey:"user_id",as:'refreshTokens',onDelete:"CASCADE"})
RefreshToken.belongsTo(User,{foreignKey:"user_id",as:"user"})

// A user can have many orders
User.hasMany(Order,{foreignKey:"user_id",as:"orders"})
Order.belongsTo(User,{foreignKey:"user_id",as:"user"})

// A order can have many items
Order.hasMany(OrderItem,{foreignKey:"order_id",as:"orderItems"})
OrderItem.belongsTo(Order,{foreignKey:"order_id",as:"order"})

// MenuItem <> OrderItem (soft — no cascade, intentional)
MenuItem.hasMany(OrderItem, { foreignKey: 'menu_item_id', as: 'orderItems' })
OrderItem.belongsTo(MenuItem, { foreignKey: 'menu_item_id', as: 'menuItem' })

MenuItem.hasMany(MenuItemImage,{foreignKey:"menu_item_id", as:"images",onDelete:"CASCADE"})
MenuItemImage.belongsTo(MenuItem,{foreignKey:"menu_item_id",as:"menuItem"})

Order.hasOne(Payment,{foreignKey:"order_id",as:"payment",onDelete:"CASCADE"})
Payment.belongsTo(Order,{foreignKey:"order_id",as:"order"})

User.hasMany(Rating,{foreignKey:"user_id",as:"ratings"})
Rating.belongsTo(User,{foreignKey:"user_id",as:"user"})

Order.hasMany(Rating,{foreignKey:"order_id",as:"ratings"})
Rating.belongsTo(Order,{foreignKey:"order_id",as:"order"})

MenuItem.hasMany(Rating,{foreignKey:"menu_item_id",as:"ratings"})
Rating.belongsTo(MenuItem,{foreignKey:"menu_item_id",as:"menuItem"})

module.exports={sequelize,User,RefreshToken,MenuItem,Order,OrderItem,MenuItemImage,Payment,Rating}