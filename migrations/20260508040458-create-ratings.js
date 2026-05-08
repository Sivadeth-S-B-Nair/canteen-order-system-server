'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable("ratings",{
      id:{
        type:Sequelize.INTEGER,
        primaryKey:true,
        allowNull:false,
        autoIncrement:true
      },
      user_id:{
        type:Sequelize.INTEGER,
        allowNull:false,
        references:{model:"users",key:"id"},
        onDelete:"CASCADE",
        onUpdate:"CASCADE"
      },
      order_id:{
        type:Sequelize.INTEGER,
        allowNull:false,
        references:{model:"orders",key:"id"},
        onDelete:"CASCADE",
        onUpdate:"CASCADE"
      },
      menu_item_id:{
        type:Sequelize.INTEGER,
        allowNull:false,
        references:{model:"menu_items",key:"id"},
        onDelete:"CASCADE",
        onUpdate:"CASCADE"
      },
      rating:{
        type:Sequelize.TINYINT.UNSIGNED,
        allowNull:false
      },
      review:{
        type:Sequelize.TEXT,
        allowNull:true
      },
      created_at:{
        type:Sequelize.DATE,
        allowNull:false
      },
      updated_at:{
        type:Sequelize.DATE,
        allowNull:false
      }
    })
    // This is the key constraint — prevents submitting the same rating twice
    // It's a COMPOSITE unique index across three columns together
    // One rating per (user, order, menu item) combination
    await queryInterface.addIndex("ratings",["user_id","order_id","menu_item_id"],{
      unique:true,
      name:"unique_rating_per_item_per_order"
    })
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable("ratings")
  }
};
