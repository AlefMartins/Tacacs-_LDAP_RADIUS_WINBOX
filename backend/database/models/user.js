'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsToMany(models.Group, {
        through: 'user_groups',
        foreignKey: 'user_id',
        as: 'groups'
      });

      User.hasMany(models.AuditLog, {
        foreignKey: 'username',
        sourceKey: 'username',
        as: 'auditLogs'
      });
    }

    // Métodos de instância
    hasPermission(permission) {
      if (this.access_level >= 15) return true; // Admin tem todas as permissões
      return this.permissions && this.permissions.includes(permission);
    }

    async updateLastLogin() {
      this.last_login = new Date();
      await this.save();
    }

    isActive() {
      return this.status === 'active';
    }

    getPreference(key, defaultValue = null) {
      return this.preferences?.[key] ?? defaultValue;
    }
  }

  User.init({
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
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
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'inactive', 'blocked']]
      }
    },
    preferences: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return User;
};