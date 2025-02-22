const os = require('os');
const { Device, AuditLog, Setting } = require('../database/models');
const EmailService = require('./email.service');
const logger = require('../utils/logger');

class MonitorService {
  constructor() {
    this.metrics = {
      cpu: [],
      memory: [],
      sessions: 0,
      activeDevices: 0,
      lastUpdate: null
    };
    this.alertThresholds = {
      cpu: 80,    // 80% CPU
      memory: 85, // 85% RAM
      disk: 90    // 90% Disco
    };
  }

  async initialize() {
    // Iniciar coleta de métricas
    this.startMetricsCollection();
    
    // Iniciar verificações automáticas
    this.startDeviceStatusCheck();
    this.startLogCleanup();
    this.startADSync();
  }

  // Coleta de métricas do sistema
  async collectSystemMetrics() {
    try {
      const cpuUsage = await this.getCPUUsage();
      const memoryUsage = this.getMemoryUsage();
      const diskUsage = await this.getDiskUsage();
      
      this.metrics = {
        cpu: [...this.metrics.cpu.slice(-60), cpuUsage], // Manter últimos 60 registros
        memory: [...this.metrics.memory.slice(-60), memoryUsage],
        disk: diskUsage,
        sessions: await this.getActiveSessions(),
        activeDevices: await this.getActiveDevices(),
        lastUpdate: new Date()
      };

      // Verificar alertas
      await this.checkAlerts();

      return this.metrics;
    } catch (error) {
      logger.error('Erro ao coletar métricas:', error);
      throw error;
    }
  }

  // Monitor de recursos
  async getCPUUsage() {
    const cpus = os.cpus();
    const totalCPU = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0);
    return totalCPU / cpus.length;
  }

  getMemoryUsage() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    return (used / total) * 100;
  }

  async getDiskUsage() {
    // Implementar verificação de disco com node-disk-info
    return 0;
  }

  async getActiveSessions() {
    // Retornar número de sessões ativas do seu serviço de sessão
    return 0;
  }

  async getActiveDevices() {
    return await Device.count({
      where: {
        status: 'online'
      }
    });
  }

  // Verificações automáticas
  startDeviceStatusCheck() {
    setInterval(async () => {
      try {
        const devices = await Device.findAll();
        for (const device of devices) {
          const previousStatus = device.status;
          const currentStatus = await this.checkDeviceStatus(device);
          
          if (previousStatus !== currentStatus) {
            await this.handleStatusChange(device, previousStatus, currentStatus);
          }
        }
      } catch (error) {
        logger.error('Erro na verificação de status dos dispositivos:', error);
      }
    }, 60000); // Verificar a cada minuto
  }

  async checkDeviceStatus(device) {
    // Implementar verificação de status
    return 'online';
  }

  startLogCleanup() {
    setInterval(async () => {
      try {
        const settings = await Setting.findOne();
        const retentionDays = settings.audit_retention_days || 90;
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        await AuditLog.destroy({
          where: {
            created_at: {
              [Op.lt]: cutoffDate
            }
          }
        });

        logger.info(`Logs mais antigos que ${retentionDays} dias foram limpos`);
      } catch (error) {
        logger.error('Erro na limpeza de logs:', error);
      }
    }, 24 * 60 * 60 * 1000); // Executar diariamente
  }

  startADSync() {
    setInterval(async () => {
      try {
        await ADSyncService.syncAllUsers();
        logger.info('Sincronização com AD concluída');
      } catch (error) {
        logger.error('Erro na sincronização com AD:', error);
      }
    }, 30 * 60 * 1000); // Sincronizar a cada 30 minutos
  }

  // Sistema de alertas
  async checkAlerts() {
    const metrics = this.metrics;
    const settings = await Setting.findOne();
    const alerts = [];

    if (metrics.cpu[metrics.cpu.length - 1] > this.alertThresholds.cpu) {
      alerts.push({
        type: 'cpu',
        message: `Uso de CPU alto: ${metrics.cpu[metrics.cpu.length - 1].toFixed(2)}%`
      });
    }

    if (metrics.memory[metrics.memory.length - 1] > this.alertThresholds.memory) {
      alerts.push({
        type: 'memory',
        message: `Uso de memória alto: ${metrics.memory[metrics.memory.length - 1].toFixed(2)}%`
      });
    }

    if (metrics.disk > this.alertThresholds.disk) {
      alerts.push({
        type: 'disk',
        message: `Uso de disco alto: ${metrics.disk.toFixed(2)}%`
      });
    }

    // Enviar alertas por email se configurado
    if (alerts.length > 0 && settings.alert_email) {
      await EmailService.sendAlerts(settings.alert_email, alerts);
    }

    return alerts;
  }

  // Relatórios e métricas
  async getSystemStatus() {
    const activeUsers = await this.getActiveUsers();
    const devices = await this.getDeviceStats();
    
    return {
      metrics: this.metrics,
      users: {
        total: activeUsers.total,
        admins: activeUsers.admins,
        noc: activeUsers.noc,
        monitor: activeUsers.monitor,
        lastLogins: activeUsers.lastLogins
      },
      devices: {
        total: devices.total,
        online: devices.online,
        offline: devices.offline,
        byType: devices.byType
      },
      alerts: await this.checkAlerts()
    };
  }

  async getActiveUsers() {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    const [activeUsers, userStats] = await Promise.all([
      AuditLog.findAll({
        where: {
          action: 'LOGIN',
          created_at: {
            [Op.gte]: fifteenMinutesAgo
          },
          status: 'SUCCESS'
        },
        attributes: ['username'],
        include: [{
          model: User,
          attributes: ['access_level']
        }],
        order: [['created_at', 'DESC']]
      }),
      User.findAll({
        attributes: [
          'access_level',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['access_level']
      })
    ]);

    // Obter últimos logins únicos por usuário
    const uniqueActiveUsers = activeUsers.reduce((acc, log) => {
      if (!acc[log.username]) {
        acc[log.username] = {
          username: log.username,
          accessLevel: log.User.access_level,
          lastLogin: log.created_at
        };
      }
      return acc;
    }, {});

    // Contar usuários por nível de acesso
    const activeByLevel = Object.values(uniqueActiveUsers).reduce((acc, user) => {
      if (user.accessLevel === 15) acc.admins++;
      else if (user.accessLevel === 10) acc.noc++;
      else acc.monitor++;
      return acc;
    }, { admins: 0, noc: 0, monitor: 0 });

    return {
      total: Object.keys(uniqueActiveUsers).length,
      ...activeByLevel,
      totalUsers: userStats.reduce((acc, stat) => acc + parseInt(stat.get('count')), 0),
      lastLogins: Object.values(uniqueActiveUsers)
        .sort((a, b) => b.lastLogin - a.lastLogin)
        .slice(0, 10) // Últimos 10 logins
    };
  }

  async getDeviceStats() {
    const devices = await Device.findAll({
      attributes: [
        'status',
        'manufacturer',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status', 'manufacturer']
    });

    const stats = {
      total: 0,
      online: 0,
      offline: 0,
      byType: {}
    };

    devices.forEach(device => {
      const count = parseInt(device.get('count'));
      stats.total += count;
      
      if (device.status === 'online') stats.online += count;
      else if (device.status === 'offline') stats.offline += count;

      if (!stats.byType[device.manufacturer]) {
        stats.byType[device.manufacturer] = {
          total: 0,
          online: 0,
          offline: 0
        };
      }
      
      stats.byType[device.manufacturer].total += count;
      if (device.status === 'online') {
        stats.byType[device.manufacturer].online += count;
      } else {
        stats.byType[device.manufacturer].offline += count;
      }
    });

    return stats;
  }
}

module.exports = new MonitorService();