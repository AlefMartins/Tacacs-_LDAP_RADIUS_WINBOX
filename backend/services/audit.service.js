const { AuditLog } = require('../database/models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class AuditService {
  async logEvent(event) {
    try {
      const logEntry = {
        action: event.action,
        username: event.username,
        device_id: event.deviceId,
        details: event.details || JSON.stringify(event),
        ip_address: event.ip_address,
        status: event.status || 'SUCCESS'
      };

      // Registrar no banco de dados
      const auditLog = await AuditLog.create(logEntry);

      // Log para o sistema
      logger.info('Audit event:', {
        id: auditLog.id,
        ...logEntry
      });

      return auditLog;
    } catch (error) {
      logger.error('Erro ao registrar evento de auditoria:', error);
      throw error;
    }
  }

  async getLogs(filters) {
    try {
      const {
        page = 1,
        limit = 50,
        startDate,
        endDate,
        username,
        action,
        deviceId,
        status
      } = filters;

      const query = {};

      // Filtro de data
      if (startDate || endDate) {
        query.created_at = {};
        if (startDate) {
          query.created_at[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          query.created_at[Op.lte] = new Date(endDate);
        }
      }

      // Outros filtros
      if (username) {
        query.username = { [Op.like]: `%${username}%` };
      }
      if (action) {
        query.action = action;
      }
      if (deviceId) {
        query.device_id = deviceId;
      }
      if (status) {
        query.status = status;
      }

      const { rows: logs, count } = await AuditLog.findAndCountAll({
        where: query,
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        order: [['created_at', 'DESC']],
        include: ['device'] // Include device details if needed
      });

      return {
        logs,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit),
        limit: parseInt(limit)
      };
    } catch (error) {
      logger.error('Erro ao buscar logs:', error);
      throw error;
    }
  }

  async getDeviceLogs(deviceId, filters = {}) {
    return this.getLogs({
      ...filters,
      deviceId
    });
  }

  async getUserLogs(username, filters = {}) {
    return this.getLogs({
      ...filters,
      username
    });
  }

  async getCommandLogs(deviceId, filters = {}) {
    return this.getLogs({
      ...filters,
      deviceId,
      action: 'command_execute'
    });
  }

  async getLoginHistory(username, filters = {}) {
    return this.getLogs({
      ...filters,
      username,
      action: 'LOGIN'
    });
  }

  async getSessionHistory(deviceId, filters = {}) {
    const sessionLogs = await this.getLogs({
      ...filters,
      deviceId,
      action: { [Op.in]: ['session_start', 'session_end'] }
    });

    // Agrupar logs por sessão
    const sessions = [];
    let currentSession = null;

    for (const log of sessionLogs.logs) {
      if (log.action === 'session_start') {
        currentSession = {
          sessionId: log.id,
          username: log.username,
          deviceId: log.device_id,
          startTime: log.created_at,
          endTime: null,
          duration: null,
          commands: []
        };
      } else if (log.action === 'session_end' && currentSession) {
        currentSession.endTime = log.created_at;
        currentSession.duration = (new Date(log.created_at) - new Date(currentSession.startTime)) / 1000;
        sessions.push(currentSession);
        currentSession = null;
      }
    }

    // Buscar comandos para cada sessão
    for (const session of sessions) {
      const commands = await this.getLogs({
        deviceId,
        username: session.username,
        action: 'command_execute',
        startDate: session.startTime,
        endDate: session.endTime
      });
      session.commands = commands.logs;
    }

    return {
      sessions,
      total: sessions.length,
      page: filters.page || 1,
      limit: filters.limit || 50
    };
  }

  async getSystemEvents(filters = {}) {
    const systemEvents = ['system_start', 'system_stop', 'config_change', 'error'];
    return this.getLogs({
      ...filters,
      action: { [Op.in]: systemEvents }
    });
  }

  async getFailedActions(filters = {}) {
    return this.getLogs({
      ...filters,
      status: 'FAILED'
    });
  }

  async clearOldLogs(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const deleted = await AuditLog.destroy({
        where: {
          created_at: {
            [Op.lt]: cutoffDate
          }
        }
      });

      logger.info(`Deleted ${deleted} old audit logs`);
      return deleted;
    } catch (error) {
      logger.error('Erro ao limpar logs antigos:', error);
      throw error;
    }
  }
}

module.exports = new AuditService();