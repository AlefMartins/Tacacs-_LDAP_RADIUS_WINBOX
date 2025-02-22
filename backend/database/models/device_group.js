'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DeviceGroup extends Model {
    static associate(models) {
      // Associações já definidas nos modelos Device e AccessGroup
    }
  }

  DeviceGroup.init({
    device_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'devices',
        key: 'id'
      }
    },
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'access_groups',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'DeviceGroup',
    tableName: 'device_groups',
    timestamps: true,
    updatedAt: false,
    createdAt: 'created_at'
  });

  return DeviceGroup;
};