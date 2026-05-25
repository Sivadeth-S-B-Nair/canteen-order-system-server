'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Which promo was used (nullable — most orders have none)
    await queryInterface.addColumn('orders', 'promo_code_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
      references: { model: 'promo_codes', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      after: 'special_instructions',
    });

    // How much was knocked off (snapshot — promo_codes can change later)
    await queryInterface.addColumn('orders', 'discount_amount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      after: 'promo_code_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('orders', 'discount_amount');
    await queryInterface.removeColumn('orders', 'promo_code_id');
  },
};