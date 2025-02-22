// YYYYMMDDHHMMSS-create-settings.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('settings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ad_url: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      ad_base_dn: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      ad_bind_dn: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      ad_bind_password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      ad_domain: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      tacacs_server_ip: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      tacacs_key: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('settings');
  }
};