const { Device, AuditLog } = require('../database/models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs').promises;

class ReportService {
  constructor() {
    this.reportsDir = path.join(__dirname, '../../reports');
  }

  async initialize() {
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
    } catch (error) {
      logger.error('Erro ao criar diretório de relatórios:', error);
      throw error;
    }
  }

  async generateAccessReport(startDate, endDate) {
    try {
      const logs = await AuditLog.findAll({
        where: {
          action: {
            [Op.in]: ['LOGIN', 'command_execute', 'session_start', 'session_end']
          },
          created_at: {
            [Op.between]: [startDate, endDate]
          }
        },
        include: ['device'],
        order: [['created_at', 'ASC']]
      });

      const report = {
        totalLogins: logs.filter(log => log.action === 'LOGIN').length,
        totalSessions: logs.filter(log => log.action === 'session_start').length,
        commandsExecuted: logs.filter(log => log.action === 'command_execute').length,
        userSummary: this.summarizeByUser(logs),
        deviceSummary: this.summarizeByDevice(logs),
        timelineSummary: this.summarizeByTime(logs),
        rawLogs: logs
      };

      return await this.exportToExcel('access_report', report);
    } catch (error) {
      logger.error('Erro ao gerar relatório de acessos:', error);
      throw error;
    }
  }

  async generateDeviceReport(startDate, endDate) {
    try {
      const devices = await Device.findAll({
        include: [{
          model: AuditLog,
          as: 'auditLogs',
          where: {
            created_at: {
              [Op.between]: [startDate, endDate]
            }
          },
          required: false
        }]
      });

      const report = {
        totalDevices: devices.length,
        activeDevices: devices.filter(d => d.auditLogs.length > 0).length,
        statusSummary: this.summarizeDeviceStatus(devices),
        deviceDetails: devices.map(device => ({
          name: device.name,
          ip: device.ip,
          status: device.status,
          lastAccessed: device.last_accessed_at,
          totalAccesses: device.auditLogs.length,
          commandsExecuted: device.auditLogs.filter(log => log.action === 'command_execute').length
        }))
      };

      return await this.exportToExcel('device_report', report);
    } catch (error) {
      logger.error('Erro ao gerar relatório de dispositivos:', error);
      throw error;
    }
  }

  async generatePerformanceReport(startDate, endDate) {
    try {
      const devices = await Device.findAll({
        attributes: ['id', 'name', 'ip', 'status', 'latency'],
        where: {
          last_check: {
            [Op.between]: [startDate, endDate]
          }
        }
      });

      const report = {
        devicePerformance: devices.map(device => ({
          name: device.name,
          ip: device.ip,
          status: device.status,
          latency: device.latency,
          latencyCategory: this.categorizeLatency(device.latency)
        })),
        summary: {
          totalDevices: devices.length,
          averageLatency: this.calculateAverageLatency(devices),
          performanceCategories: this.summarizePerformance(devices)
        }
      };

      return await this.exportToExcel('performance_report', report);
    } catch (error) {
      logger.error('Erro ao gerar relatório de performance:', error);
      throw error;
    }
  }

  async generateAuditReport(startDate, endDate) {
    try {
      const logs = await AuditLog.findAll({
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          }
        },
        include: ['device'],
        order: [['created_at', 'ASC']]
      });

      const report = {
        totalEvents: logs.length,
        eventsByType: _.groupBy(logs, 'action'),
        eventsByUser: _.groupBy(logs, 'username'),
        timeline: this.createTimeline(logs),
        rawLogs: logs.map(log => ({
          timestamp: log.created_at,
          action: log.action,
          username: log.username,
          device: log.device?.name || 'N/A',
          details: log.details,
          status: log.status
        }))
      };

      return await this.exportToExcel('audit_report', report);
    } catch (error) {
      logger.error('Erro ao gerar relatório de auditoria:', error);
      throw error;
    }
  }

  async exportToExcel(reportType, data) {
    const workbook = new ExcelJS.Workbook();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${reportType}_${timestamp}.xlsx`;
    const filePath = path.join(this.reportsDir, fileName);

    try {
      // Configurar planilha de acordo com o tipo de relatório
      switch (reportType) {
        case 'access_report':
          await this.formatAccessReport(workbook, data);
          break;
        case 'device_report':
          await this.formatDeviceReport(workbook, data);
          break;
        case 'performance_report':
          await this.formatPerformanceReport(workbook, data);
          break;
        case 'audit_report':
          await this.formatAuditReport(workbook, data);
          break;
      }

      await workbook.xlsx.writeFile(filePath);

      return {
        fileName,
        path: filePath,
        type: reportType,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Erro ao exportar para Excel:', error);
      throw error;
    }
  }

  private summarizeByUser(logs) {
    return _.chain(logs)
      .groupBy('username')
      .map((userLogs, username) => ({
        username,
        totalLogins: userLogs.filter(log => log.action === 'LOGIN').length,
        totalSessions: userLogs.filter(log => log.action === 'session_start').length,
        commandsExecuted: userLogs.filter(log => log.action === 'command_execute').length,
        lastAccess: _.maxBy(userLogs, 'created_at')?.created_at
      }))
      .value();
  }

  private summarizeByDevice(logs) {
    return _.chain(logs)
      .filter(log => log.device)
      .groupBy('device.name')
      .map((deviceLogs, deviceName) => ({
        deviceName,
        totalSessions: deviceLogs.filter(log => log.action === 'session_start').length,
        commandsExecuted: deviceLogs.filter(log => log.action === 'command_execute').length,
        uniqueUsers: _.uniq(deviceLogs.map(log => log.username)).length,
        lastAccess: _.maxBy(deviceLogs, 'created_at')?.created_at
      }))
      .value();
  }

  private summarizeByTime(logs) {
    return _.chain(logs)
      .groupBy(log => {
        const date = new Date(log.created_at);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      })
      .map((dayLogs, date) => ({
        date,
        totalEvents: dayLogs.length,
        logins: dayLogs.filter(log => log.action === 'LOGIN').length,
        sessions: dayLogs.filter(log => log.action === 'session_start').length,
        commands: dayLogs.filter(log => log.action === 'command_execute').length
      }))
      .value();
  }

  private categorizeLatency(latency) {
    if (latency === null) return 'N/A';
    if (latency < 50) return 'Excelente';
    if (latency < 100) return 'Bom';
    if (latency < 200) return 'Regular';
    return 'Ruim';
  }

  private calculateAverageLatency(devices) {
    const validLatencies = devices
      .map(d => d.latency)
      .filter(l => l !== null);
    return validLatencies.length ? 
      (validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length) : 
      null;
  }

  private summarizePerformance(devices) {
    return _.chain(devices)
      .groupBy(device => this.categorizeLatency(device.latency))
      .mapValues(devices => devices.length)
      .value();
  }

  private createTimeline(logs) {
    return _.chain(logs)
      .groupBy(log => {
        const date = new Date(log.created_at);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      })
      .map((dayLogs, date) => ({
        date,
        events: _.groupBy(dayLogs, 'action')
      }))
      .value();
  }

  private async formatAccessReport(workbook, data) {
    // Implementar formatação específica para relatório de acesso
    const sheet = workbook.addWorksheet('Acessos');
    // Adicionar cabeçalhos e dados
  }

  private async formatDeviceReport(workbook, data) {
    // Implementar formatação específica para relatório de dispositivos
    const sheet = workbook.addWorksheet('Dispositivos');
    // Adicionar cabeçalhos e dados
  }

  private async formatPerformanceReport(workbook, data) {
    // Implementar formatação específica para relatório de performance
    const sheet = workbook.addWorksheet('Performance');
    // Adicionar cabeçalhos e dados
  }

  private async formatAuditReport(workbook, data) {
    // Implementar formatação específica para relatório de auditoria
    const sheet = workbook.addWorksheet('Auditoria');
    // Adicionar cabeçalhos e dados
  }
}

module.exports = new ReportService();