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
      ALTER TABLE users
      MODIFY COLUMN role
        ENUM('user', 'super_admin', 'restaurant_admin', 'kitchen_staff', 'delivery_agent')
        NOT NULL
        DEFAULT 'user'
    `);
    await queryInterface.addColumn("orders", "assigned_agent_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
      after: "discount_amount", // MySQL positional hint
    });
    await queryInterface.addColumn("orders", "estimated_delivery_time", {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
      after: "assigned_agent_id",
    });
    await queryInterface.addIndex("orders", ["assigned_agent_id"], {
      name: "orders_assigned_agent_id_idx",
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeIndex("orders", "orders_assigned_agent_id_idx");
    await queryInterface.removeColumn("orders", "estimated_delivery_time");
    await queryInterface.removeColumn("orders", "assigned_agent_id");

    await queryInterface.sequelize.query(`
      ALTER TABLE users
      MODIFY COLUMN role
        ENUM('user', 'super_admin', 'restaurant_admin', 'kitchen_staff')
        NOT NULL
        DEFAULT 'user'
    `);
  },
};
