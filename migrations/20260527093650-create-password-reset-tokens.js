"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("password_reset_tokens", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      token_hash: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
      },

      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      used_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },

      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("password_reset_tokens", ["token_hash"], {
      name: "password_reset_tokens_hash_idx",
      unique: true,
    });

    await queryInterface.addIndex("password_reset_tokens", ["expires_at"], {
      name: "password_reset_tokens_expires_at_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("password_reset_tokens");
  },
};
