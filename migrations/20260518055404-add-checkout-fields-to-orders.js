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
    await queryInterface.addColumn("orders","delivery_type",{
      type:Sequelize.ENUM("dine_in","delivery"),
      allowNull:false,
      defaultValue:"dine_in",
      after:"restaurant_id"
    })
    await queryInterface.addColumn("orders","delivery_address_id",{
      type:Sequelize.INTEGER,
      allowNull:true,
      references:{
        model:"user_addresses",
        key:"id"
      },
      onUpdate:"CASCADE",
      onDelete:"SET NULL",
      after:"delivery_type"
    })
    await queryInterface.addColumn("orders","special_instructions",{
      type:Sequelize.TEXT,
      allowNull:true,
      after:"delivery_address_id"
    })
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn("orders","special_instructions")
    await queryInterface.removeColumn("orders","delivery_address_id")
    await queryInterface.removeColumn("orders","delivery_type")
  }
};
