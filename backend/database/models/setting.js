'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Setting extends Model {
    static associate(models) {
      // define associations here if needed
    }

    // Métodos para retornar as imagens em base64
    getLogoUrl() {
      if (this.system_logo && this.system_logo_type) {
        return `data:${this.system_logo_type};base64,${this.system_logo}`;
      }
      return null;
    }

    getFaviconUrl() {
      if (this.system_favicon && this.system_favicon_type) {
        return `data:${this.system_favicon_type};base64,${this.system_favicon}`;
      }
      return null;
    }
  }

  Setting.init({
    // Campos existentes
    ad_url: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        isUrl: true
      }
    },
    ad_base_dn: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    ad_bind_dn: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    ad_bind_password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    ad_domain: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    tacacs_server_ip: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isIP: true
      }
    },
    tacacs_key: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    // Novos campos para imagens
    system_logo: {
      type: DataTypes.TEXT('long'),
      allowNull: true
    },
    system_logo_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    system_favicon: {
      type: DataTypes.TEXT('long'),
      allowNull: true
    },
    system_favicon_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    // Campos para integrações
    integrations: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        siem: null,
        webhooks: []
      }
    },
    // Configurações do sistema
    session_timeout: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1800, // 30 minutos
      validate: {
        min: 300,
        max: 86400
      }
    },
    max_sessions_per_user: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      validate: {
        min: 1,
        max: 10
      }
    },
    audit_retention_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 90,
      validate: {
        min: 30,
        max: 365
      }
    }
  }, {
    sequelize,
    modelName: 'Setting',
    tableName: 'settings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Setting;
};