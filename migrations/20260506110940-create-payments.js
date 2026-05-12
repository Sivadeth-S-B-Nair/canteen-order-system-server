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
      `ALTER TABLE orders MODIFY COLUMN status ENUM("PAYMENT_PENDING","CONFIRMED","Cooking","Ready","Picked Up") NOT NULL DEFAULT "PAYMENT_PENDING"`,
    );

    await queryInterface.createTable("payments",{
      id:{
        type:Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement:true,
        allowNull:false
      },
      order_id:{
        type:Sequelize.INTEGER,
        allowNull:false,
        unique:true,
        references:{model:"orders",key:"id"},
        onDelete:"CASCADE",
        onUpdate:"CASCADE"
      },
      amount:{
        type:Sequelize.DECIMAL(10,2),
        allowNull:false
      },
      status:{
        type:Sequelize.ENUM("PENDING","PAID","FAILED"),
        allowNull:false,
        defaultValue:"PENDING"
      },
      method:{
        type:Sequelize.STRING,
        allowNull:true
      },
      transaction_id:{
        type:Sequelize.STRING,
        allowNull:true,
        unique:true
      },
      paid_at:{
        type:Sequelize.DATE,
        allowNull:true
      },
      created_at:{
        type:Sequelize.DATE,
        allowNull:false
      },
      updated_at:{
        type:Sequelize.DATE,
        allowNull:false
      }
    })
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable("payments")

    await queryInterface.sequelize.query(`ALTER TABLE orders MODIFY COLUMN status ENUM("Ordered","Cooking","Ready","Picked Up") NOT NULL DEFAULT "Ordered"`)
  },
};
