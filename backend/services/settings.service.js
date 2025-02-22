const { Setting } = require('../database/models');
const logger = require('../utils/logger');
const AuditService = require('./audit.service');

class SettingsService {
  constructor() {
    this.settings = null;
    this.lastLoadTime = null;
  }

  async initialize() {
    await this.loadSettings();
  }

  async loadSettings() {
    try {
      this.settings = await Setting.findOne();
      
      if (!this.settings) {
        // Criar configurações padrão se não existirem
        this.settings = await Setting.create({
          ad_url: process.env.AD_URL,
          ad_base_dn: process.env.AD_BASE_DN,
          ad_bind_dn: process.env.AD_BIND_DN,
          ad_bind_password: process.env.AD_BIND_PASSWORD,
          ad_domain: process.env.AD_DOMAIN,
          tacacs_server_ip: process.env.TACACS_SERVER_IP,
          tacacs_key: process.env.TACACS_KEY
        });
      }

      this.lastLoadTime = new Date();
      logger.info('Configurações carregadas com sucesso');
    } catch (error) {
      logger.error('Erro ao carregar configurações:', error);
      throw error;
    }
  }

  async getSettings() {
    // Recarregar se as configurações não foram carregadas ou têm mais de 5 minutos
    if (!this.settings || 
        !this.lastLoadTime || 
        (new Date() - this.lastLoadTime) > 300000) {
      await this.loadSettings();
    }
    return this.settings;
  }

  async updateSettings(newSettings, username) {
    try {
      const oldSettings = { ...this.settings.toJSON() };
      delete oldSettings.ad_bind_password;
      delete oldSettings.tacacs_key;

      // Se senha AD não fornecida, manter a atual
      if (!newSettings.ad_bind_password) {
        delete newSettings.ad_bind_password;
      }

      // Se chave TACACS não fornecida, manter a atual
      if (!newSettings.tacacs_key) {
        delete newSettings.tacacs_key;
      }

      await this.settings.update(newSettings);
      await this.loadSettings(); // Recarregar configurações

      // Registrar alteração nas configurações
      await AuditService.logEvent({
        action: 'settings_update',
        username: username,
        details: `Configurações atualizadas. Alterações: ${this.getChangedFields(oldSettings, newSettings)}`
      });

      return this.settings;
    } catch (error) {
      logger.error('Erro ao atualizar configurações:', error);
      throw error;
    }
  }

  getChangedFields(oldSettings, newSettings) {
    const changes = [];
    for (const key in newSettings) {
      if (oldSettings[key] !== newSettings[key] && 
          !['ad_bind_password', 'tacacs_key'].includes(key)) {
        changes.push(key);
      }
    }
    return changes.join(', ');
  }

  async validatePasswordComplexity(password) {
    const settings = await this.getSettings();
    const complexity = settings.password_complexity;

    const validations = {
      length: password.length >= complexity.minLength,
      uppercase: !complexity.requireUppercase || /[A-Z]/.test(password),
      lowercase: !complexity.requireLowercase || /[a-z]/.test(password),
      numbers: !complexity.requireNumbers || /[0-9]/.test(password),
      special: !complexity.requireSpecial || /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const failed = Object.entries(validations)
      .filter(([, valid]) => !valid)
      .map(([type]) => type);

    return {
      valid: failed.length === 0,
      failed,
      requirements: complexity
    };
  }

  async getADSettings() {
    const settings = await this.getSettings();
    return {
      url: settings.ad_url,
      baseDN: settings.ad_base_dn,
      bindDN: settings.ad_bind_dn,
      domain: settings.ad_domain
    };
  }

  async getTacacsSettings() {
    const settings = await this.getSettings();
    return {
      serverIP: settings.tacacs_server_ip
    };
  }

  async getSessionSettings() {
    const settings = await this.getSettings();
    return {
      timeout: settings.session_timeout,
      maxSessionsPerUser: settings.max_sessions_per_user
    };
  }
}

module.exports = new SettingsService();