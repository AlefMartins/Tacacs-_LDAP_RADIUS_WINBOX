'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Group extends Model {
    static associate(models) {
      Group.belongsToMany(models.User, {
        through: 'user_groups',
        foreignKey: 'group_id',
        as: 'users'
      });

      Group.belongsToMany(models.Device, {
        through: 'device_groups',
        foreignKey: 'group_id',
        as: 'devices'
      });
    }

    // Métodos de instância
    hasPermission(permission) {
      return this.permissions && this.permissions.includes(permission);
    }

    async addPermission(permission) {
      if (!this.permissions) this.permissions = [];
      if (!this.permissions.includes(permission)) {
        this.permissions.push(permission);
        await this.save();
      }
    }

    async removePermission(permission) {
      if (this.permissions) {
        this.permissions = this.permissions.filter(p => p !== permission);
        await this.save();
      }
    }

    async getUserCount() {
      return this.countUsers();
    }

    async getDeviceCount() {
      return this.countDevices();
    }
  }

  Group.init({
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    access_level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      validate: {
        min: 0,
        max: 15
      }
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      get() {
        const rawValue = this.getDataValue('permissions');
        return rawValue ? (Array.isArray(rawValue) ? rawValue : []) : [];
      },
      set(value) {
        this.setDataValue('permissions', 
          Array.isArray(value) ? [...new Set(value)] : []
        );
      }
    }
  }, {
    sequelize,
    modelName: 'Group',
    tableName: 'groups',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Definição de permissões padrão
  Group.PERMISSIONS = {
    VIEW_DEVICES: 'view_devices',
    MANAGE_DEVICES: 'manage_devices',
    VIEW_AUDIT: 'view_audit',
    MANAGE_USERS: 'manage_users',
    MANAGE_GROUPS: 'manage_groups',
    SYSTEM_SETTINGS: 'system_settings'
  };

  return Group;
};