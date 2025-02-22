'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('devices', 'latency', {
      type: Sequelize.FLOAT,
      allowNull: true,
      after: 'status'
    });

    await queryInterface.addColumn('devices', 'last_check', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'latency'
    });

    await queryInterface.addColumn('devices', 'packet_loss', {
      type: Sequelize.FLOAT,
      allowNull: true,
      after: 'latency'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('devices', 'latency');
    await queryInterface.removeColumn('devices', 'last_check');
    await queryInterface.removeColumn('devices', 'packet_loss');
  }
};