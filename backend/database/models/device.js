'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Device extends Model {
    static associate(models) {
      Device.belongsToMany(models.AccessGroup, {
        through: 'device_groups',
        foreignKey: 'device_id',
        as: 'groups'
      });
      Device.hasMany(models.AuditLog, {
        foreignKey: 'device_id',
        as: 'auditLogs'
      });
    }

    // Método para retornar a imagem em base64
    getImageUrl() {
      if (this.device_image && this.device_image_type) {
        return `data:${this.device_image_type};base64,${this.device_image}`;
      }
      return null;
    }
  }
  
  Device.init({
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    ip: {
      type: DataTypes.STRING(15),
      allowNull: false,
      validate: {
        isIP: true
      }
    },
    port: {
      type: DataTypes.INTEGER,
      defaultValue: 22,
      validate: {
        min: 1,
        max: 65535
      }
    },
    manufacturer: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    model: {
      type: DataTypes.STRING(100)
    },
    device_image: {
      type: DataTypes.TEXT('long'),
      allowNull: true
    },
    device_image_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'unknown'
    },
    latency: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    packet_loss: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    last_check: {
      type: DataTypes.DATE,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT
    },
    created_by: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    last_accessed_by: {
      type: DataTypes.STRING(100)
    },
    last_accessed_at: {
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'Device',
    tableName: 'devices',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  return Device;
};