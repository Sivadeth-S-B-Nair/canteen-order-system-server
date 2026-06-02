"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.sequelize.query(`
      ALTER TABLE orders
      MODIFY COLUMN status
        ENUM(
          'PAYMENT_PENDING',
          'CONFIRMED',
          'Cooking',
          'Ready',
          'Out for Delivery',
          'Delivered',
          'Picked Up',
          'CANCELLED'
        )
        NOT NULL
        DEFAULT 'PAYMENT_PENDING'
    `);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.sequelize.query(`
      ALTER TABLE orders
      MODIFY COLUMN status
        ENUM(
          'PAYMENT_PENDING',
          'CONFIRMED',
          'Cooking',
          'Ready',
          'Picked Up',
          'CANCELLED'
        )
        NOT NULL
        DEFAULT 'PAYMENT_PENDING'
    `);
  },
};
