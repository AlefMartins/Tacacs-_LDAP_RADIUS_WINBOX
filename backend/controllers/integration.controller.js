const IntegrationService = require('../services/integration.service');
const AuditService = require('../services/audit.service');
const logger = require('../utils/logger');

class IntegrationController {
  // Webhooks
  async addWebhook(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const webhook = await IntegrationService.addWebhook(req.body);

      await AuditService.logEvent({
        action: 'webhook_create',
        username: req.user.username,
        details: `Webhook criado: ${webhook.id} - ${webhook.url}`
      });

      res.status(201).json(webhook);
    } catch (error) {
      logger.error('Erro ao criar webhook:', error);
      res.status(500).json({ error: 'Erro ao criar webhook' });
    }
  }

  async updateWebhook(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const webhook = await IntegrationService.updateWebhook(
        req.params.id,
        req.body
      );

      await AuditService.logEvent({
        action: 'webhook_update',
        username: req.user.username,
        details: `Webhook atualizado: ${webhook.id}`
      });

      res.json(webhook);
    } catch (error) {
      logger.error('Erro ao atualizar webhook:', error);
      res.status(500).json({ error: 'Erro ao atualizar webhook' });
    }
  }

  async deleteWebhook(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      await IntegrationService.deleteWebhook(req.params.id);

      await AuditService.logEvent({
        action: 'webhook_delete',
        username: req.user.username,
        details: `Webhook deletado: ${req.params.id}`
      });

      res.json({ message: 'Webhook deletado com sucesso' });
    } catch (error) {
      logger.error('Erro ao deletar webhook:', error);
      res.status(500).json({ error: 'Erro ao deletar webhook' });
    }
  }

  async listWebhooks(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const webhooks = Array.from(IntegrationService.webhooks.values());
      res.json(webhooks);
    } catch (error) {
      logger.error('Erro ao listar webhooks:', error);
      res.status(500).json({ error: 'Erro ao listar webhooks' });
    }
  }

  // SIEM Configuration
  async updateSIEMConfig(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const { url, token, format } = req.body;

      if (!url || !token || !format) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
      }

      IntegrationService.siemConfig = { url, token, format };

      await AuditService.logEvent({
        action: 'siem_config_update',
        username: req.user.username,
        details: 'Configuração SIEM atualizada'
      });

      res.json({ message: 'Configuração SIEM atualizada com sucesso' });
    } catch (error) {
      logger.error('Erro ao atualizar configuração SIEM:', error);
      res.status(500).json({ error: 'Erro ao atualizar configuração SIEM' });
    }
  }

  async getSIEMConfig(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      res.json(IntegrationService.siemConfig || {});
    } catch (error) {
      logger.error('Erro ao buscar configuração SIEM:', error);
      res.status(500).json({ error: 'Erro ao buscar configuração SIEM' });
    }
  }

  // API Export
  async exportData(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const { type } = req.params;
      const filters = req.query;

      const data = await IntegrationService.exportAPIData(type, filters);

      await AuditService.logEvent({
        action: 'data_export',
        username: req.user.username,
        details: `Dados exportados: ${type}`
      });

      res.json(data);
    } catch (error) {
      logger.error('Erro ao exportar dados:', error);
      res.status(500).json({ error: 'Erro ao exportar dados' });
    }
  }

  // Test Integration
  async testWebhook(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const { id } = req.params;
      const testEvent = {
        action: 'webhook_test',
        details: 'Teste de webhook',
        timestamp: new Date()
      };

      await IntegrationService.sendWebhook(
        IntegrationService.webhooks.get(id),
        testEvent
      );

      res.json({ message: 'Teste de webhook enviado com sucesso' });
    } catch (error) {
      logger.error('Erro ao testar webhook:', error);
      res.status(500).json({ error: 'Erro ao testar webhook' });
    }
  }

  async testSIEM(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const testEvent = {
        action: 'siem_test',
        details: 'Teste de integração SIEM',
        severity: 'info',
        timestamp: new Date()
      };

      await IntegrationService.sendToSIEM(testEvent);

      res.json({ message: 'Teste SIEM enviado com sucesso' });
    } catch (error) {
      logger.error('Erro ao testar SIEM:', error);
      res.status(500).json({ error: 'Erro ao testar SIEM' });
    }
  }
}

module.exports = new IntegrationController();