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
    await queryInterface.sequelize.query(
      `ALTER TABLE users MODIFY COLUMN role ENUM("user","super_admin","restaurant_admin","kitchen_staff") NOT NULL DEFAULT "user"`,
    );

    await queryInterface.addColumn("users", "restaurant_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "restaurants",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn("users", "restaurant_id");
    await queryInterface.sequelize.query(
      `ALTER TABLE users MODIFY COLUMN role ENUM("user","kitchen") NOT NULL DEFAULT "user"`,
    );
  },
};
