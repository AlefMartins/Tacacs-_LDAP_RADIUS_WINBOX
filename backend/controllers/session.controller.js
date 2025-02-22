const SessionService = require('../services/session.service');
const logger = require('../utils/logger');

class SessionController {
  async getUserSessions(req, res) {
    try {
      const sessions = SessionService.getUserSessions(req.user.id);
      res.json(sessions);
    } catch (error) {
      logger.error('Erro ao buscar sessões do usuário:', error);
      res.status(500).json({ error: 'Erro ao buscar sessões do usuário' });
    }
  }

  async getDeviceSessions(req, res) {
    try {
      if (req.user.accessLevel < 10) { // NOC ou superior
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const sessions = SessionService.getDeviceSessions(req.params.deviceId);
      res.json(sessions);
    } catch (error) {
      logger.error('Erro ao buscar sessões do dispositivo:', error);
      res.status(500).json({ error: 'Erro ao buscar sessões do dispositivo' });
    }
  }

  async getSessionStats(req, res) {
    try {
      if (req.user.accessLevel < 15) { // Apenas admin
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const stats = await SessionService.getSessionStats();
      res.json(stats);
    } catch (error) {
      logger.error('Erro ao buscar estatísticas de sessões:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas de sessões' });
    }
  }

  async getSessionHistory(req, res) {
    try {
      if (req.user.accessLevel < 10) { // NOC ou superior
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const history = await SessionService.getSessionHistory(
        req.query.userId,
        req.query.deviceId
      );
      res.json(history);
    } catch (error) {
      logger.error('Erro ao buscar histórico de sessões:', error);
      res.status(500).json({ error: 'Erro ao buscar histórico de sessões' });
    }
  }

  async endSession(req, res) {
    try {
      const { sessionId } = req.params;
      const session = SessionService.getSession(sessionId);

      if (!session) {
        return res.status(404).json({ error: 'Sessão não encontrada' });
      }

      // Permitir que o usuário encerre suas próprias sessões ou que um admin encerre qualquer sessão
      if (session.username !== req.user.username && req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      await SessionService.endSession(sessionId, 'user_terminated');
      res.json({ message: 'Sessão encerrada com sucesso' });
    } catch (error) {
      logger.error('Erro ao encerrar sessão:', error);
      res.status(500).json({ error: 'Erro ao encerrar sessão' });
    }
  }

  async endAllUserSessions(req, res) {
    try {
      if (req.user.accessLevel < 15) { // Apenas admin
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const { username } = req.params;
      const sessions = SessionService.getUserSessions(username);

      for (const session of sessions) {
        await SessionService.endSession(session.id, 'admin_terminated');
      }

      res.json({ 
        message: 'Sessões encerradas com sucesso',
        sessionsTerminated: sessions.length
      });
    } catch (error) {
      logger.error('Erro ao encerrar sessões do usuário:', error);
      res.status(500).json({ error: 'Erro ao encerrar sessões do usuário' });
    }
  }

  async endAllDeviceSessions(req, res) {
    try {
      if (req.user.accessLevel < 15) { // Apenas admin
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const { deviceId } = req.params;
      const sessions = SessionService.getDeviceSessions(deviceId);

      for (const session of sessions) {
        await SessionService.endSession(session.id, 'device_maintenance');
      }

      res.json({ 
        message: 'Sessões do dispositivo encerradas com sucesso',
        sessionsTerminated: sessions.length
      });
    } catch (error) {
      logger.error('Erro ao encerrar sessões do dispositivo:', error);
      res.status(500).json({ error: 'Erro ao encerrar sessões do dispositivo' });
    }
  }
}

module.exports = new SessionController();