'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Adicionando novos campos na tabela devices
    await queryInterface.addColumn('devices', 'model', {
      type: Sequelize.STRING(100),
      after: 'manufacturer',
      allowNull: true
    });

    await queryInterface.addColumn('devices', 'description', {
      type: Sequelize.TEXT,
      after: 'status',
      allowNull: true
    });

    await queryInterface.addColumn('devices', 'last_accessed_by', {
      type: Sequelize.STRING(100),
      after: 'created_by',
      allowNull: true
    });

    await queryInterface.addColumn('devices', 'last_accessed_at', {
      type: Sequelize.DATE,
      after: 'last_accessed_by',
      allowNull: true
    });

    // Adicionando novos campos na tabela audit_logs
    await queryInterface.addColumn('audit_logs', 'device_id', {
      type: Sequelize.INTEGER,
      after: 'username',
      allowNull: true,
      references: {
        model: 'devices',
        key: 'id'
      }
    });

    await queryInterface.addColumn('audit_logs', 'status', {
      type: Sequelize.STRING(50),
      after: 'details',
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    // Removendo campos da tabela devices
    await queryInterface.removeColumn('devices', 'model');
    await queryInterface.removeColumn('devices', 'description');
    await queryInterface.removeColumn('devices', 'last_accessed_by');
    await queryInterface.removeColumn('devices', 'last_accessed_at');

    // Removendo campos da tabela audit_logs
    await queryInterface.removeColumn('audit_logs', 'device_id');
    await queryInterface.removeColumn('audit_logs', 'status');
  }
};