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

    //   INSERT ... ON DUPLICATE KEY UPDATE lat=..., lng=..., updated_at=NOW()
    await queryInterface.createTable("agent_locations", {
      // PK = agent_id so ON DUPLICATE KEY UPDATE works cleanly
      agent_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",  
      },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        references: { model: "orders", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: false,
      },
      longitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: false,
      },
      // No created_at — this table has no insert history, only the latest state
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        onUpdate: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("agent_locations", ["order_id"], {
      name: "agent_locations_order_id_idx",
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable("agent_locations");
  },
};
