'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('orders',{
      id:{
        type:Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement:true,
        allowNull:false
      },
      user_id:{
        type:Sequelize.INTEGER,
        allowNull:false,
        references:{model:"users",key:"id"},
        onUpdate:'CASCADE',
        onDelete:'CASCADE'
      },
      total_price:{
        type:Sequelize.DECIMAL(10,2),
        allowNull:false
      },
      status:{
        type:Sequelize.ENUM('Ordered','Cooking','Ready','Picked Up'),
        defaultValue:'Ordered'
      },
      cooking_started_at:{
        type:Sequelize.DATE,
      },
      ready_at:{
        type:Sequelize.DATE
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

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('orders')
  }
};
