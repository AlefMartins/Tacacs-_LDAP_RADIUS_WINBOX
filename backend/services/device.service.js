const fs = require('fs').promises;
const path = require('path');
const ping = require('ping');
const { Device } = require('../database/models');
const logger = require('../utils/logger');

class DeviceService {
  constructor() {
    this.devices = [];
    this.DEVICES_FILE = path.join(__dirname, '../../data/devices.json');
  }

  async initialize() {
    await this.loadDevices();
    this.startStatusUpdateInterval();
  }

  async loadDevices() {
    try {
      const data = await fs.readFile(this.DEVICES_FILE, 'utf8');
      this.devices = JSON.parse(data);
      logger.info(`${this.devices.length} dispositivos carregados com sucesso`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.info('Arquivo de dispositivos não encontrado, iniciando com array vazio');
        this.devices = [];
      } else {
        logger.error('Erro ao carregar dispositivos:', error);
        this.devices = [];
      }
    }
  }

  async saveDevices() {
    try {
      await fs.mkdir(path.dirname(this.DEVICES_FILE), { recursive: true });
      await fs.writeFile(this.DEVICES_FILE, JSON.stringify(this.devices, null, 2));
      logger.info('Dispositivos salvos com sucesso');
    } catch (error) {
      logger.error('Erro ao salvar dispositivos:', error);
    }
  }

  async checkDeviceStatus(device) {
    try {
      logger.info(`Verificando status do dispositivo ${device.name} (${device.ip})`);
      const result = await ping.promise.probe(device.ip, {
        timeout: 2,
        extra: ['-c', '1']
      });
      const status = result.alive ? 'online' : 'offline';
      logger.info(`Status do dispositivo ${device.name}: ${status}`);
      return status;
    } catch (error) {
      logger.error(`Erro verificando status do dispositivo ${device.name}:`, error);
      return 'error';
    }
  }

  async updateAllDevicesStatus() {
    logger.info('Iniciando atualização de status de todos os dispositivos...');
    try {
      for (let device of this.devices) {
        device.status = await this.checkDeviceStatus(device);
      }
      await this.saveDevices();
      logger.info('Atualização de status concluída');
    } catch (error) {
      logger.error('Erro durante atualização de status:', error);
    }
  }

  startStatusUpdateInterval() {
    this.updateAllDevicesStatus();
    setInterval(() => this.updateAllDevicesStatus(), 60000); // A cada minuto
  }

  // CRUD Operations
  async getAllDevices(userGroups, accessLevel) {
    return this.devices.map(device => {
      const userHasAccess = device.groups.some(deviceGroup =>
        userGroups.some(userGroup => 
          userGroup.toUpperCase() === deviceGroup.toUpperCase()
        )
      );

      if (!userHasAccess) return null;

      if (accessLevel >= 10) {
        return device;
      }

      return {
        id: device.id,
        name: device.name,
        status: device.status
      };
    }).filter(device => device !== null);
  }

  async addDevice(deviceData, username) {
    const device = {
      id: Date.now().toString(),
      ...deviceData,
      status: 'unknown',
      createdBy: username,
      createdAt: new Date().toISOString()
    };

    this.devices.push(device);
    await this.saveDevices();
    
    device.status = await this.checkDeviceStatus(device);
    await this.saveDevices();

    return device;
  }

  async updateDevice(id, updateData, username) {
    const deviceIndex = this.devices.findIndex(d => d.id === id);
    if (deviceIndex === -1) {
      throw new Error('Dispositivo não encontrado');
    }

    const updatedDevice = {
      ...this.devices[deviceIndex],
      ...updateData,
      id: this.devices[deviceIndex].id,
      updatedBy: username,
      updatedAt: new Date().toISOString()
    };

    this.devices[deviceIndex] = updatedDevice;
    await this.saveDevices();

    updatedDevice.status = await this.checkDeviceStatus(updatedDevice);
    await this.saveDevices();

    return updatedDevice;
  }

  async deleteDevice(id) {
    const deviceIndex = this.devices.findIndex(d => d.id === id);
    if (deviceIndex === -1) {
      throw new Error('Dispositivo não encontrado');
    }

    const deletedDevice = this.devices[deviceIndex];
    this.devices.splice(deviceIndex, 1);
    await this.saveDevices();

    return deletedDevice;
  }

  async checkSingleDeviceStatus(id) {
    const device = this.devices.find(d => d.id === id);
    if (!device) {
      throw new Error('Dispositivo não encontrado');
    }

    device.status = await this.checkDeviceStatus(device);
    await this.saveDevices();
    
    return { status: device.status };
  }
}

module.exports = new DeviceService();