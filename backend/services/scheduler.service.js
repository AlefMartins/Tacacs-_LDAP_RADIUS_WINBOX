const schedule = require('node-schedule');
const logger = require('../utils/logger');
const DeviceMonitorService = require('./device-monitor.service');
const AuditService = require('./audit.service');
const SettingsService = require('./settings.service');

class SchedulerService {
  constructor() {
    this.jobs = new Map();
  }

  async initialize() {
    try {
      await this.setupDeviceMonitoring();
      await this.setupLogCleanup();
      await this.setupSessionCleanup();
      logger.info('Scheduler inicializado com sucesso');
    } catch (error) {
      logger.error('Erro ao inicializar scheduler:', error);
      throw error;
    }
  }

  async setupDeviceMonitoring() {
    // Monitoramento a cada minuto
    const monitoringJob = schedule.scheduleJob('*/1 * * * *', async () => {
      try {
        await DeviceMonitorService.checkAllDevices();
      } catch (error) {
        logger.error('Erro no job de monitoramento:', error);
      }
    });

    this.jobs.set('deviceMonitoring', monitoringJob);
  }

  async setupLogCleanup() {
    // Limpeza de logs às 00:00 todos os dias
    const logCleanupJob = schedule.scheduleJob('0 0 * * *', async () => {
      try {
        const settings = await SettingsService.getSettings();
        await AuditService.clearOldLogs(settings.audit_retention_days);
      } catch (error) {
        logger.error('Erro no job de limpeza de logs:', error);
      }
    });

    this.jobs.set('logCleanup', logCleanupJob);
  }

  async setupSessionCleanup() {
    // Verificação de sessões inativas a cada 5 minutos
    const sessionCleanupJob = schedule.scheduleJob('*/5 * * * *', async () => {
      try {
        const settings = await SettingsService.getSessionSettings();
        this.cleanupInactiveSessions(settings.timeout);
      } catch (error) {
        logger.error('Erro no job de limpeza de sessões:', error);
      }
    });

    this.jobs.set('sessionCleanup', sessionCleanupJob);
  }

  async cleanupInactiveSessions(timeout) {
    // Esta função será implementada quando criarmos o gerenciamento de sessões
    logger.info('Iniciando limpeza de sessões inativas');
  }

  stopJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.cancel();
      this.jobs.delete(jobName);
      logger.info(`Job ${jobName} parado`);
    }
  }

  stopAllJobs() {
    for (const [jobName, job] of this.jobs.entries()) {
      job.cancel();
      logger.info(`Job ${jobName} parado`);
    }
    this.jobs.clear();
  }

  async updateSchedule(jobName, cronExpression) {
    this.stopJob(jobName);

    const job = schedule.scheduleJob(cronExpression, async () => {
      switch (jobName) {
        case 'deviceMonitoring':
          await DeviceMonitorService.checkAllDevices();
          break;
        case 'logCleanup':
          const settings = await SettingsService.getSettings();
          await AuditService.clearOldLogs(settings.audit_retention_days);
          break;
        case 'sessionCleanup':
          const sessionSettings = await SettingsService.getSessionSettings();
          await this.cleanupInactiveSessions(sessionSettings.timeout);
          break;
      }
    });

    this.jobs.set(jobName, job);
    logger.info(`Job ${jobName} atualizado com nova programação: ${cronExpression}`);
  }

  getJobStatus() {
    const status = {};
    for (const [jobName, job] of this.jobs.entries()) {
      status[jobName] = {
        running: !!job,
        nextInvocation: job ? job.nextInvocation() : null
      };
    }
    return status;
  }
}

module.exports = new SchedulerService();