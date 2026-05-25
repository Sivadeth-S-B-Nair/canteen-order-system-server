'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('promo_usages', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      promo_code_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'promo_codes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      // Snapshot: how much was actually discounted on this order
      discount_applied: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    // Prevent double-use of same promo on same order
    await queryInterface.addIndex('promo_usages', ['promo_code_id', 'order_id'], {
      unique: true,
      name: 'promo_usages_promo_order_unique',
    });

    // Fast lookup: has this user used this promo before?
    await queryInterface.addIndex('promo_usages', ['promo_code_id', 'user_id'], {
      name: 'promo_usages_promo_user_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('promo_usages');
  },
};