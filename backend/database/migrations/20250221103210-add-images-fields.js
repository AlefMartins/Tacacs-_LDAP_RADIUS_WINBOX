'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Adicionar campos para dispositivos
    await queryInterface.addColumn('devices', 'device_image', {
      type: Sequelize.TEXT('long'),
      allowNull: true
    });

    await queryInterface.addColumn('devices', 'device_image_type', {
      type: Sequelize.STRING(50),
      allowNull: true
    });

    // Adicionar campos para configurações do sistema
    await queryInterface.addColumn('settings', 'system_logo', {
      type: Sequelize.TEXT('long'),
      allowNull: true
    });

    await queryInterface.addColumn('settings', 'system_logo_type', {
      type: Sequelize.STRING(50),
      allowNull: true
    });

    await queryInterface.addColumn('settings', 'system_favicon', {
      type: Sequelize.TEXT('long'),
      allowNull: true
    });

    await queryInterface.addColumn('settings', 'system_favicon_type', {
      type: Sequelize.STRING(50),
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    // Remover campos de dispositivos
    await queryInterface.removeColumn('devices', 'device_image');
    await queryInterface.removeColumn('devices', 'device_image_type');

    // Remover campos de configurações
    await queryInterface.removeColumn('settings', 'system_logo');
    await queryInterface.removeColumn('settings', 'system_logo_type');
    await queryInterface.removeColumn('settings', 'system_favicon');
    await queryInterface.removeColumn('settings', 'system_favicon_type');
  }
};