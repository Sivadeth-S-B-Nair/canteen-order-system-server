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
    await queryInterface.createTable("menu_item_images",{
      id:{
        type:Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement:true,
        allowNull:false
      },
      menu_item_id:{
        type:Sequelize.INTEGER,
        allowNull:false,
        references:{model:"menu_items",key:"id"},
        onUpdate:"CASCADE",
        onDelete:"CASCADE"
      },
      image_url:{
        type:Sequelize.STRING(2048),
        allowNull:false
      },
      display_order:{
        type:Sequelize.INTEGER,
        defaultValue:0, // lower = shown first in carousel
        allowNull:false
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
    await queryInterface.dropTable("menu_item_images")
  }
};
