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
    await queryInterface.addColumn("orders","restaurant_id",{
      type:Sequelize.INTEGER,
      allowNull:true,
      references:{
        model:"restaurants",
        key:"id"
      },
      onUpdate:"CASCADE",
      onDelete:"SET NULL"
    })
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn("orders","restaurant_id")
  }
};
