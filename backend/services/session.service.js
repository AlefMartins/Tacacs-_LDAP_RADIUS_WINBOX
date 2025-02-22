const crypto = require('crypto');
const SettingsService = require('./settings.service');
const AuditService = require('./audit.service');
const logger = require('../utils/logger');

class SessionService {
  constructor() {
    this.sessions = new Map();
    this.deviceSessions = new Map();
  }

  async createSession(userId, username, deviceId = null) {
    try {
      const settings = await SettingsService.getSessionSettings();
      
      // Verificar limite de sessões por usuário
      const userSessions = this.getUserSessions(userId);
      if (userSessions.length >= settings.maxSessionsPerUser) {
        throw new Error('Limite de sessões excedido');
      }

      const sessionId = this.generateSessionId();
      const session = {
        id: sessionId,
        userId,
        username,
        deviceId,
        startTime: new Date(),
        lastActivity: new Date(),
        commands: []
      };

      this.sessions.set(sessionId, session);

      if (deviceId) {
        if (!this.deviceSessions.has(deviceId)) {
          this.deviceSessions.set(deviceId, new Set());
        }
        this.deviceSessions.get(deviceId).add(sessionId);
      }

      await AuditService.logEvent({
        action: 'session_create',
        username,
        deviceId,
        sessionId,
        details: 'Nova sessão criada'
      });

      return sessionId;
    } catch (error) {
      logger.error('Erro ao criar sessão:', error);
      throw error;
    }
  }

  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  async updateActivity(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
      return true;
    }
    return false;
  }

  getUserSessions(userId) {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId);
  }

  getDeviceSessions(deviceId) {
    const sessionIds = this.deviceSessions.get(deviceId) || new Set();
    return Array.from(sessionIds)
      .map(sessionId => this.sessions.get(sessionId))
      .filter(session => session !== undefined);
  }

  async addCommand(sessionId, command) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.commands.push({
        command,
        timestamp: new Date()
      });

      await AuditService.logEvent({
        action: 'command_execute',
        username: session.username,
        deviceId: session.deviceId,
        sessionId,
        details: `Comando executado: ${command}`
      });
    }
  }

  async endSession(sessionId, reason = 'user_logout') {
    const session = this.sessions.get(sessionId);
    if (session) {
      const duration = new Date() - session.startTime;

      await AuditService.logEvent({
        action: 'session_end',
        username: session.username,
        deviceId: session.deviceId,
        sessionId,
        details: `Sessão encerrada. Motivo: ${reason}. Duração: ${duration/1000}s`
      });

      if (session.deviceId) {
        const deviceSessions = this.deviceSessions.get(session.deviceId);
        if (deviceSessions) {
          deviceSessions.delete(sessionId);
        }
      }

      this.sessions.delete(sessionId);
      return true;
    }
    return false;
  }

  async cleanupInactiveSessions() {
    try {
      const settings = await SettingsService.getSessionSettings();
      const now = new Date();
      const inactiveThreshold = settings.timeout * 1000; // converter para milissegundos

      for (const [sessionId, session] of this.sessions.entries()) {
        const inactiveDuration = now - session.lastActivity;
        if (inactiveDuration > inactiveThreshold) {
          await this.endSession(sessionId, 'inactivity_timeout');
        }
      }
    } catch (error) {
      logger.error('Erro ao limpar sessões inativas:', error);
    }
  }

  async getSessionStats() {
    return {
      totalSessions: this.sessions.size,
      activeUsers: new Set(Array.from(this.sessions.values()).map(s => s.username)).size,
      deviceConnections: Array.from(this.deviceSessions.entries()).map(([deviceId, sessions]) => ({
        deviceId,
        activeSessions: sessions.size
      }))
    };
  }

  async getSessionHistory(userId, deviceId = null) {
    try {
      const filters = {
        action: { $in: ['session_create', 'session_end'] }
      };

      if (userId) filters.username = userId;
      if (deviceId) filters.deviceId = deviceId;

      return await AuditService.getLogs(filters);
    } catch (error) {
      logger.error('Erro ao buscar histórico de sessões:', error);
      throw error;
    }
  }
}

module.exports = new SessionService();