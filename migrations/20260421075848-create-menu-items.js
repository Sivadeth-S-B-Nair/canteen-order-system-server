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
    await queryInterface.createTable("menu_items",{
      id:{
        type:Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement:true,
        allowNull:false
      },
      name:{
        type:Sequelize.STRING,
        allowNull:false
      },
      description:{
        type:Sequelize.TEXT,
        allowNull:false,
      },
      price:{
        type:Sequelize.DECIMAL(10,2),
        allowNull:false
      },
      category:{
        type:Sequelize.STRING,
        allowNull:false
      },
      image_url:{
        type:Sequelize.STRING,
      },
      is_available:{
        type:Sequelize.BOOLEAN,
        defaultValue:true
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
    await queryInterface.dropTable("menu_items")
  }
};
