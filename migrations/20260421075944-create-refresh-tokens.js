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
    await queryInterface.createTable('refresh_tokens',{
      id:{
        type:Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement:true,
        allowNull:false
      },
      token:{
        type:Sequelize.TEXT,
        allowNull:false
      },
      user_id:{
        type:Sequelize.INTEGER,
        allowNull:false,
        references:{model:"users",key:"id"},
        onUpdate:"CASCADE",
        onDelete:"CASCADE"
      },
      user_agent: {
        type:Sequelize.STRING,   // "which browser/device"
        allowNull:true
      },
      expires_at:{
        type:Sequelize.DATE,
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
    await queryInterface.dropTable('refresh_tokens')
  }
};
