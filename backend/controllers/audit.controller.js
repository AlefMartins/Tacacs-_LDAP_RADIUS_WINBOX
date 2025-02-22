const AuditService = require('../services/audit.service');
const logger = require('../utils/logger');

class AuditController {
  async getLogs(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const logs = await AuditService.getLogs(req.query);
      res.json(logs);
    } catch (error) {
      logger.error('Erro ao buscar logs:', error);
      res.status(500).json({ error: 'Erro ao buscar logs de auditoria' });
    }
  }

  async getDeviceLogs(req, res) {
    try {
      if (req.user.accessLevel < 10) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const logs = await AuditService.getDeviceLogs(req.params.deviceId, req.query);
      res.json(logs);
    } catch (error) {
      logger.error('Erro ao buscar logs do dispositivo:', error);
      res.status(500).json({ error: 'Erro ao buscar logs do dispositivo' });
    }
  }

  async getUserLogs(req, res) {
    try {
      if (req.user.accessLevel < 10) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const logs = await AuditService.getUserLogs(req.params.username, req.query);
      res.json(logs);
    } catch (error) {
      logger.error('Erro ao buscar logs do usuário:', error);
      res.status(500).json({ error: 'Erro ao buscar logs do usuário' });
    }
  }

  async getCommandLogs(req, res) {
    try {
      if (req.user.accessLevel < 10) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const logs = await AuditService.getCommandLogs(req.params.deviceId, req.query);
      res.json(logs);
    } catch (error) {
      logger.error('Erro ao buscar logs de comandos:', error);
      res.status(500).json({ error: 'Erro ao buscar logs de comandos' });
    }
  }

  async getLoginHistory(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const logs = await AuditService.getLoginHistory(req.params.username, req.query);
      res.json(logs);
    } catch (error) {
      logger.error('Erro ao buscar histórico de login:', error);
      res.status(500).json({ error: 'Erro ao buscar histórico de login' });
    }
  }

  async getSessionHistory(req, res) {
    try {
      if (req.user.accessLevel < 10) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const sessions = await AuditService.getSessionHistory(req.params.deviceId, req.query);
      res.json(sessions);
    } catch (error) {
      logger.error('Erro ao buscar histórico de sessões:', error);
      res.status(500).json({ error: 'Erro ao buscar histórico de sessões' });
    }
  }

  async getSystemEvents(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const events = await AuditService.getSystemEvents(req.query);
      res.json(events);
    } catch (error) {
      logger.error('Erro ao buscar eventos do sistema:', error);
      res.status(500).json({ error: 'Erro ao buscar eventos do sistema' });
    }
  }

  async getFailedActions(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const logs = await AuditService.getFailedActions(req.query);
      res.json(logs);
    } catch (error) {
      logger.error('Erro ao buscar ações falhas:', error);
      res.status(500).json({ error: 'Erro ao buscar ações falhas' });
    }
  }
}

module.exports = new AuditController();