const EmailService = require('../services/email.service');
const AuditService = require('../services/audit.service');
const logger = require('../utils/logger');

class EmailController {
  async testEmailSettings(req, res) {
    try {
      const { test_email } = req.body;
      
      if (!test_email) {
        return res.status(400).json({ error: 'Email de teste é obrigatório' });
      }

      await EmailService.sendTest(test_email);

      await AuditService.logEvent({
        action: 'email_test',
        username: req.user.username,
        details: `Teste de email enviado para ${test_email}`
      });

      res.json({ message: 'Email de teste enviado com sucesso' });
    } catch (error) {
      logger.error('Erro ao enviar email de teste:', error);
      res.status(500).json({ error: 'Erro ao enviar email de teste' });
    }
  }

  async updateEmailSettings(req, res) {
    try {
      const {
        smtp_host,
        smtp_port,
        smtp_user,
        smtp_password,
        smtp_secure,
        from_email,
        alert_recipients
      } = req.body;

      // Validar campos obrigatórios
      if (!smtp_host || !smtp_port || !smtp_user || !smtp_password) {
        return res.status(400).json({ error: 'Todos os campos SMTP são obrigatórios' });
      }

      await EmailService.initialize({
        host: smtp_host,
        port: smtp_port,
        secure: smtp_secure || false,
        auth: {
          user: smtp_user,
          pass: smtp_password
        },
        from: from_email,
        alertRecipients: alert_recipients
      });

      await AuditService.logEvent({
        action: 'email_settings_update',
        username: req.user.username,
        details: 'Configurações de email atualizadas'
      });

      res.json({ message: 'Configurações de email atualizadas com sucesso' });
    } catch (error) {
      logger.error('Erro ao atualizar configurações de email:', error);
      res.status(500).json({ error: 'Erro ao atualizar configurações de email' });
    }
  }

  async getEmailSettings(req, res) {
    try {
      const settings = await EmailService.getSettings();
      
      // Remover senha por segurança
      delete settings.smtp_password;

      res.json(settings);
    } catch (error) {
      logger.error('Erro ao buscar configurações de email:', error);
      res.status(500).json({ error: 'Erro ao buscar configurações de email' });
    }
  }

  async updateEmailTemplate(req, res) {
    try {
      const { type, subject, body } = req.body;

      if (!type || !subject || !body) {
        return res.status(400).json({ error: 'Tipo, assunto e corpo são obrigatórios' });
      }

      await EmailService.updateTemplate(type, { subject, body });

      await AuditService.logEvent({
        action: 'email_template_update',
        username: req.user.username,
        details: `Template de email '${type}' atualizado`
      });

      res.json({ message: 'Template de email atualizado com sucesso' });
    } catch (error) {
      logger.error('Erro ao atualizar template de email:', error);
      res.status(500).json({ error: 'Erro ao atualizar template de email' });
    }
  }

  async getEmailTemplates(req, res) {
    try {
      const templates = await EmailService.getTemplates();
      res.json(templates);
    } catch (error) {
      logger.error('Erro ao buscar templates de email:', error);
      res.status(500).json({ error: 'Erro ao buscar templates de email' });
    }
  }

  async addAlertRecipient(req, res) {
    try {
      const { email, alert_types } = req.body;

      if (!email || !alert_types) {
        return res.status(400).json({ error: 'Email e tipos de alerta são obrigatórios' });
      }

      await EmailService.addAlertRecipient(email, alert_types);

      await AuditService.logEvent({
        action: 'alert_recipient_add',
        username: req.user.username,
        details: `Destinatário de alerta adicionado: ${email}`
      });

      res.json({ message: 'Destinatário de alerta adicionado com sucesso' });
    } catch (error) {
      logger.error('Erro ao adicionar destinatário de alerta:', error);
      res.status(500).json({ error: 'Erro ao adicionar destinatário de alerta' });
    }
  }

  async removeAlertRecipient(req, res) {
    try {
      const { email } = req.params;

      await EmailService.removeAlertRecipient(email);

      await AuditService.logEvent({
        action: 'alert_recipient_remove',
        username: req.user.username,
        details: `Destinatário de alerta removido: ${email}`
      });

      res.json({ message: 'Destinatário de alerta removido com sucesso' });
    } catch (error) {
      logger.error('Erro ao remover destinatário de alerta:', error);
      res.status(500).json({ error: 'Erro ao remover destinatário de alerta' });
    }
  }
}

module.exports = new EmailController();