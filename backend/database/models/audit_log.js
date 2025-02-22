'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AuditLog extends Model {
    static associate(models) {
      AuditLog.belongsTo(models.Device, {
        foreignKey: 'device_id',
        as: 'device'
      });
    }
  }
  
  AuditLog.init({
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    device_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'devices',
        key: 'id'
      }
    },
    details: DataTypes.TEXT,
    status: DataTypes.STRING(50),
    ip_address: {
      type: DataTypes.STRING(15),
      validate: {
        isIP: true
      }
    }
  }, {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    timestamps: true,
    updatedAt: false,
    createdAt: 'created_at'
  });
  
  return AuditLog;
};
