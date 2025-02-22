const axios = require('axios');
const logger = require('../utils/logger');
const { Setting } = require('../database/models');

class IntegrationService {
  constructor() {
    this.webhooks = new Map();
    this.siemConfig = null;
  }

  async initialize() {
    try {
      // Carregar configurações de integrações do banco de dados
      const settings = await Setting.findOne();
      if (settings?.integrations) {
        this.siemConfig = settings.integrations.siem;
        const webhooks = settings.integrations.webhooks || [];
        webhooks.forEach(webhook => {
          this.webhooks.set(webhook.id, webhook);
        });
      }
      logger.info('Serviço de integração inicializado');
    } catch (error) {
      logger.error('Erro ao inicializar serviço de integração:', error);
      throw error;
    }
  }

  // SIEM Integration
  async sendToSIEM(event) {
    if (!this.siemConfig) {
      logger.warn('Configuração SIEM não encontrada');
      return;
    }

    try {
      const { url, token, format } = this.siemConfig;
      
      let formattedEvent;
      switch (format) {
        case 'cef':
          formattedEvent = this.formatCEF(event);
          break;
        case 'leef':
          formattedEvent = this.formatLEEF(event);
          break;
        default:
          formattedEvent = event;
      }

      await axios.post(url, formattedEvent, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info(`Evento enviado para SIEM: ${event.action}`);
    } catch (error) {
      logger.error('Erro ao enviar evento para SIEM:', error);
      throw error;
    }
  }

  // Webhook Management
  async addWebhook(webhook) {
    try {
      const id = Date.now().toString();
      const newWebhook = {
        id,
        ...webhook,
        status: 'active',
        created: new Date()
      };

      this.webhooks.set(id, newWebhook);
      await this.saveWebhooksToDb();

      return newWebhook;
    } catch (error) {
      logger.error('Erro ao adicionar webhook:', error);
      throw error;
    }
  }

  async updateWebhook(id, updates) {
    try {
      const webhook = this.webhooks.get(id);
      if (!webhook) {
        throw new Error('Webhook não encontrado');
      }

      const updatedWebhook = {
        ...webhook,
        ...updates,
        updated: new Date()
      };

      this.webhooks.set(id, updatedWebhook);
      await this.saveWebhooksToDb();

      return updatedWebhook;
    } catch (error) {
      logger.error('Erro ao atualizar webhook:', error);
      throw error;
    }
  }

  async deleteWebhook(id) {
    try {
      const deleted = this.webhooks.delete(id);
      if (deleted) {
        await this.saveWebhooksToDb();
      }
      return deleted;
    } catch (error) {
      logger.error('Erro ao deletar webhook:', error);
      throw error;
    }
  }

  async triggerWebhooks(event) {
    const promises = Array.from(this.webhooks.values())
      .filter(webhook => webhook.status === 'active' && 
        webhook.events.includes(event.action))
      .map(webhook => this.sendWebhook(webhook, event));

    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error(`Falha ao enviar webhook ${index}:`, result.reason);
      }
    });
  }

  async sendWebhook(webhook, event) {
    try {
      await axios.post(webhook.url, {
        event,
        timestamp: new Date().toISOString(),
        webhook_id: webhook.id
      }, {
        headers: webhook.headers || {}
      });

      logger.info(`Webhook enviado: ${webhook.id} - ${event.action}`);
    } catch (error) {
      logger.error(`Erro ao enviar webhook ${webhook.id}:`, error);
      throw error;
    }
  }

  // API Export
  async exportAPIData(type, filters = {}) {
    try {
      let data;
      switch (type) {
        case 'devices':
          data = await this.exportDevices(filters);
          break;
        case 'audit':
          data = await this.exportAuditLogs(filters);
          break;
        case 'stats':
          data = await this.exportStatistics(filters);
          break;
        default:
          throw new Error('Tipo de exportação inválido');
      }

      return data;
    } catch (error) {
      logger.error('Erro ao exportar dados:', error);
      throw error;
    }
  }

  // Utility Methods
  private formatCEF(event) {
    // Implementar formatação CEF (Common Event Format)
    return `CEF:0|Tacacs+|Management|1.0|${event.action}|${event.details}|${event.severity}|`;
  }

  private formatLEEF(event) {
    // Implementar formatação LEEF (Log Event Extended Format)
    return `LEEF:1.0|Tacacs+|Management|1.0|${event.action}|`;
  }

  private async saveWebhooksToDb() {
    try {
      const settings = await Setting.findOne();
      if (settings) {
        settings.integrations = {
          ...settings.integrations,
          webhooks: Array.from(this.webhooks.values())
        };
        await settings.save();
      }
    } catch (error) {
      logger.error('Erro ao salvar webhooks:', error);
      throw error;
    }
  }

  private async exportDevices(filters) {
    // Implementar exportação de dados de dispositivos
  }

  private async exportAuditLogs(filters) {
    // Implementar exportação de logs de auditoria
  }

  private async exportStatistics(filters) {
    // Implementar exportação de estatísticas
  }
}

module.exports = new IntegrationService();