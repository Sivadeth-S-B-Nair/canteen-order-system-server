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
    await queryInterface.createTable("order_items",{
      id:{
        type:Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement:true,
        allowNull:false
      },
      order_id:{
        type:Sequelize.INTEGER,
        allowNull:false,
        references:{model:'orders',key:'id'},
        onUpdate:"CASCADE",
        onDelete:"CASCADE"
      },
      menu_item_id:{
        type:Sequelize.INTEGER,
        allowNull:true
      },
      snapshot_name:{
        type:Sequelize.STRING,
        allowNull:false
      },
      snapshot_price:{
        type:Sequelize.DECIMAL(10.2),
        allowNull:false
      },
      qty:{
        type:Sequelize.INTEGER,
        allowNull:false,
        defaultValue:1
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
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('order_items')
  }
};
