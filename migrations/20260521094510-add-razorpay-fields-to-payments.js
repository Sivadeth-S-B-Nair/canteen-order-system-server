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
    await queryInterface.addColumn("payments", "razorpay_order_id", {
      type: Sequelize.STRING(100),
      allowNull: true,
      defaultValue: null,
      after: "transaction_id", // position hint (MySQL only)
    });

    await queryInterface.addColumn("payments", "razorpay_payment_id", {
      type: Sequelize.STRING(100),
      allowNull: true,
      defaultValue: null,
      after: "razorpay_order_id",
    });

    await queryInterface.addColumn("payments", "razorpay_signature", {
      type: Sequelize.STRING(512),
      allowNull: true,
      defaultValue: null,
      after: "razorpay_payment_id",
    });

    // Index for webhook lookup: Payment.findOne({ where: { razorpayOrderId } })
    await queryInterface.addIndex("payments", ["razorpay_order_id"], {
      name: "payments_razorpay_order_id_idx",
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeIndex(
      "payments",
      "payments_razorpay_order_id_idx",
    );
    await queryInterface.removeColumn("payments", "razorpay_signature");
    await queryInterface.removeColumn("payments", "razorpay_payment_id");
    await queryInterface.removeColumn("payments", "razorpay_order_id");
  },
};
