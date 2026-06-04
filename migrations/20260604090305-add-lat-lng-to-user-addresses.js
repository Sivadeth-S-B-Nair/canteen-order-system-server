// [CHANGE 2] New migration: adds latitude and longitude columns to user_addresses
// so saved delivery addresses can be rendered as a pin on the live-tracking map.
// Run: npx sequelize-cli db:migrate

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('user_addresses', 'latitude', {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: true,
      defaultValue: null,
      after: 'phone',
    });
    await queryInterface.addColumn('user_addresses', 'longitude', {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: true,
      defaultValue: null,
      after: 'latitude',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('user_addresses', 'longitude');
    await queryInterface.removeColumn('user_addresses', 'latitude');
  },
};