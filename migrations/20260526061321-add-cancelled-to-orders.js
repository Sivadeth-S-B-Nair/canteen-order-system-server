'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE orders
      MODIFY COLUMN status
        ENUM('PAYMENT_PENDING','CONFIRMED','Cooking','Ready','Picked Up','CANCELLED')
        NOT NULL
        DEFAULT 'PAYMENT_PENDING'
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE orders
      MODIFY COLUMN status
        ENUM('PAYMENT_PENDING','CONFIRMED','Cooking','Ready','Picked Up')
        NOT NULL
        DEFAULT 'PAYMENT_PENDING'
    `);
  },
};