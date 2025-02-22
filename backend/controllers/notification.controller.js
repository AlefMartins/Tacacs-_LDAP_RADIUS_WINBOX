const NotificationService = require('../services/notification.service');
const AuditService = require('../services/audit.service');
const logger = require('../utils/logger');

class NotificationController {
  async getActiveConnections(req, res) {
    try {
      const connections = Array.from(NotificationService.clients.entries()).map(([username, ws]) => ({
        username,
        connected: ws.readyState === ws.OPEN,
        lastActivity: NotificationService.getLastActivity(username)
      }));

      res.json(connections);
    } catch (error) {
      logger.error('Erro ao buscar conexões ativas:', error);
      res.status(500).json({ error: 'Erro ao buscar conexões ativas' });
    }
  }

  async sendNotification(req, res) {
    try {
      const { type, message, recipients, groups } = req.body;

      if (!type || !message) {
        return res.status(400).json({ error: 'Tipo e mensagem são obrigatórios' });
      }

      if (recipients) {
        for (const username of recipients) {
          NotificationService.sendToUser(username, {
            type,
            message,
            sentBy: req.user.username
          });
        }
      }

      if (groups) {
        for (const group of groups) {
          NotificationService.sendToGroup(group, {
            type,
            message,
            sentBy: req.user.username
          });
        }
      }

      await AuditService.logEvent({
        action: 'notification_sent',
        username: req.user.username,
        details: `Notificação enviada: ${message}`
      });

      res.json({ message: 'Notificação enviada com sucesso' });
    } catch (error) {
      logger.error('Erro ao enviar notificação:', error);
      res.status(500).json({ error: 'Erro ao enviar notificação' });
    }
  }

  async broadcastNotification(req, res) {
    try {
      const { type, message } = req.body;

      if (!type || !message) {
        return res.status(400).json({ error: 'Tipo e mensagem são obrigatórios' });
      }

      NotificationService.sendToAll({
        type,
        message,
        sentBy: req.user.username
      });

      await AuditService.logEvent({
        action: 'notification_broadcast',
        username: req.user.username,
        details: `Broadcast enviado: ${message}`
      });

      res.json({ message: 'Broadcast enviado com sucesso' });
    } catch (error) {
      logger.error('Erro ao enviar broadcast:', error);
      res.status(500).json({ error: 'Erro ao enviar broadcast' });
    }
  }

  async getNotificationHistory(req, res) {
    try {
      const { page = 1, limit = 50, type } = req.query;

      const logs = await AuditService.getLogs({
        page,
        limit,
        action: type ? `notification_${type}` : /^notification_/,
        order: [['created_at', 'DESC']]
      });

      res.json(logs);
    } catch (error) {
      logger.error('Erro ao buscar histórico de notificações:', error);
      res.status(500).json({ error: 'Erro ao buscar histórico de notificações' });
    }
  }

  async getUserNotificationSettings(req, res) {
    try {
      const settings = await NotificationService.getUserSettings(req.user.username);
      res.json(settings);
    } catch (error) {
      logger.error('Erro ao buscar configurações de notificação:', error);
      res.status(500).json({ error: 'Erro ao buscar configurações de notificação' });
    }
  }

  async updateUserNotificationSettings(req, res) {
    try {
      const { enabled_types, email_notifications } = req.body;
      
      await NotificationService.updateUserSettings(req.user.username, {
        enabled_types,
        email_notifications
      });

      await AuditService.logEvent({
        action: 'notification_settings_update',
        username: req.user.username,
        details: 'Configurações de notificação atualizadas'
      });

      res.json({ message: 'Configurações atualizadas com sucesso' });
    } catch (error) {
      logger.error('Erro ao atualizar configurações de notificação:', error);
      res.status(500).json({ error: 'Erro ao atualizar configurações de notificação' });
    }
  }

  async disconnectUser(req, res) {
    try {
      const { username } = req.params;

      if (req.user.accessLevel < 15 && req.user.username !== username) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const disconnected = await NotificationService.disconnectUser(username);

      if (disconnected) {
        await AuditService.logEvent({
          action: 'user_disconnected',
          username: req.user.username,
          details: `Usuário desconectado: ${username}`
        });

        res.json({ message: 'Usuário desconectado com sucesso' });
      } else {
        res.status(404).json({ error: 'Usuário não encontrado ou já desconectado' });
      }
    } catch (error) {
      logger.error('Erro ao desconectar usuário:', error);
      res.status(500).json({ error: 'Erro ao desconectar usuário' });
    }
  }
}

module.exports = new NotificationController();