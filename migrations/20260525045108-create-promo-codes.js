'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('promo_codes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      // Scoped to one restaurant, or NULL = platform-wide
      restaurant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'restaurants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,   // globally unique — easier for users to type
      },
      discount_type: {
        type: Sequelize.ENUM('percentage', 'fixed'),
        allowNull: false,
      },
      discount_value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Percentage (0-100) or fixed rupee/dollar amount',
      },
      // e.g. discount only applies if cart >= 200
      min_order_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      // caps percentage discounts: 20% off but max ₹100
      max_discount_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,   // null = never expires
      },
      usage_limit: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,   // null = unlimited
      },
      // Denormalised counter — avoids COUNT(PromoUsage) on every validation
      used_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    // Admins list codes by restaurant; most queries filter on this
    await queryInterface.addIndex('promo_codes', ['restaurant_id'], {
      name: 'promo_codes_restaurant_id_idx',
    });
    // Validation lookup is always by code string
    await queryInterface.addIndex('promo_codes', ['code'], {
      name: 'promo_codes_code_idx',
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('promo_codes');
  },
};