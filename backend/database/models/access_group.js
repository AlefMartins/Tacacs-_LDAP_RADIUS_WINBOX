'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AccessGroup extends Model {
    static associate(models) {
      AccessGroup.belongsToMany(models.Device, {
        through: 'device_groups',
        foreignKey: 'group_id',
        as: 'devices'
      });
    }
  }

  AccessGroup.init({
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    ad_group_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    access_level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    description: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'AccessGroup',
    tableName: 'access_groups',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return AccessGroup;
};