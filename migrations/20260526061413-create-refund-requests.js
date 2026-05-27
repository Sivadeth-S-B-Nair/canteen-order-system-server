'use strict';

// WHY A SEPARATE TABLE (not a column on orders):
//
// A refund request is its own entity with its own lifecycle. Putting
// refund_status, refund_reason, admin_notes directly on the orders table would:
//   1. Bloat the orders table with nullable columns that only apply to ~1% of rows
//   2. Prevent tracking history (you'd overwrite the same row)
//   3. Make it harder to build an admin panel that lists only refund requests
//
// This table is a one-to-one with orders (one order can have at most one refund
// request), enforced by the UNIQUE constraint on order_id.
//
// STATUS LIFECYCLE:
//   PENDING  → admin has not acted yet (created on cancellation of a paid order)
//   APPROVED → admin approved; refund was attempted via Razorpay
//   REJECTED → admin rejected with a reason
//
// RAZORPAY REFUND FIELDS:
//   razorpay_refund_id  → the refund ID Razorpay returns on success
//   razorpay_refund_status → the status Razorpay reports ('processed', 'failed', etc.)
//   These may be null if the refund was manual or Razorpay call failed.

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('refund_requests', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      // Which order this refund is for.
      // UNIQUE: one order → at most one refund request.
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      // Snapshot of who owns this request (denormalised for fast admin queries
      // without joining through orders → users every time).
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      // Amount eligible for refund — snapshot of order.total_price at
      // cancellation time. Stored so it remains accurate even if the order
      // record is later updated.
      refund_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },

      // Admin review state
      status: {
        type: Sequelize.ENUM('PENDING', 'APPROVED', 'REJECTED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },

      // Free-text reason the user gave when cancelling.
      // Optional — we don't force users to explain.
      cancellation_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
      },

      // Admin note when approving or rejecting.
      // Required when rejecting (enforced at service layer, not DB level).
      admin_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
      },

      // Which admin acted on this request (audit trail).
      reviewed_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },

      // When the admin made their decision.
      reviewed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },

      // Razorpay refund API response — populated when we successfully call
      // the Razorpay refund endpoint. Null for PAYMENT_PENDING cancellations
      // (no payment was made) or if Razorpay call failed.
      razorpay_refund_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null,
      },

      razorpay_refund_status: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: null,
      },

      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    // Admin panel lists refund requests by restaurant — this index makes that fast.
    // We'll join refund_requests → orders → restaurant_id for scoping.
    await queryInterface.addIndex('refund_requests', ['user_id'], {
      name: 'refund_requests_user_id_idx',
    });
    await queryInterface.addIndex('refund_requests', ['status'], {
      name: 'refund_requests_status_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('refund_requests');
  },
};