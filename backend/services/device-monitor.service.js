const ping = require('ping');
const logger = require('../utils/logger');
const DeviceService = require('./device.service');
const AuditService = require('./audit.service');

class DeviceMonitorService {
  constructor() {
    this.monitoringInterval = null;
    this.deviceStatus = new Map();
  }

  async initialize() {
    this.startMonitoring();
  }

  startMonitoring() {
    // Verificar status a cada 1 minuto
    this.monitoringInterval = setInterval(async () => {
      await this.checkAllDevices();
    }, 60000);

    // Primeira verificação imediata
    this.checkAllDevices();
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  async checkDeviceStatus(device) {
    try {
      logger.debug(`Verificando status do dispositivo ${device.name} (${device.ip})`);
      
      const result = await ping.promise.probe(device.ip, {
        timeout: 2,
        extra: ['-c', '4'] // 4 pings para melhor média
      });

      // Verificar porta SSH
      const portStatus = await this.checkPort(device.ip, device.port || 22);

      const status = {
        state: result.alive ? (portStatus ? 'online' : 'port_closed') : 'offline',
        latency: result.alive ? parseFloat(result.avg) : null,
        packetLoss: parseFloat(result.packetLoss),
        lastCheck: new Date().toISOString()
      };

      // Atualizar Map de status
      this.deviceStatus.set(device.id, status);
      return status;

    } catch (error) {
      logger.error(`Erro ao verificar status do dispositivo ${device.name}:`, error);
      return {
        state: 'error',
        latency: null,
        packetLoss: 100,
        lastCheck: new Date().toISOString()
      };
    }
  }

  async checkPort(host, port) {
    return new Promise((resolve) => {
      const net = require('net');
      const socket = new net.Socket();
      const timeout = 2000;

      socket.setTimeout(timeout);

      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('error', () => {
        resolve(false);
      });

      socket.connect(port, host);
    });
  }

  async checkAllDevices() {
    try {
      const devices = await DeviceService.getAllDevices();
      
      for (const device of devices) {
        const previousStatus = this.deviceStatus.get(device.id);
        const currentStatus = await this.checkDeviceStatus(device);

        // Se houve mudança de status, registrar no log
        if (previousStatus && previousStatus.state !== currentStatus.state) {
          await AuditService.logEvent({
            action: 'device_status_change',
            deviceId: device.id,
            deviceName: device.name,
            details: `Status alterado de ${previousStatus.state} para ${currentStatus.state}. Latência: ${currentStatus.latency}ms`
          });
        }

        // Atualizar no banco de dados
        await DeviceService.updateDeviceStatus(device.id, {
          status: currentStatus.state,
          latency: currentStatus.latency,
          packet_loss: currentStatus.packetLoss,
          last_check: currentStatus.lastCheck
        });
      }
    } catch (error) {
      logger.error('Erro ao verificar status dos dispositivos:', error);
    }
  }

  async checkDeviceStatusOnDemand(deviceId) {
    const device = await DeviceService.getDeviceById(deviceId);
    if (!device) {
      throw new Error('Dispositivo não encontrado');
    }

    const statusInfo = await this.checkDeviceStatus(device);
    
    await DeviceService.updateDeviceStatus(deviceId, {
      status: statusInfo.state,
      latency: statusInfo.latency,
      packet_loss: statusInfo.packetLoss,
      last_check: statusInfo.lastCheck
    });
    
    return {
      id: deviceId,
      name: device.name,
      status: statusInfo.state,
      latency: statusInfo.latency,
      packetLoss: statusInfo.packetLoss,
      lastCheck: statusInfo.lastCheck
    };
  }

  getDeviceStatus(deviceId) {
    return this.deviceStatus.get(deviceId) || {
      state: 'unknown',
      latency: null,
      packetLoss: null,
      lastCheck: null
    };
  }
}

module.exports = new DeviceMonitorService();