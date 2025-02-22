const DeviceService = require('../services/device.service');
const DeviceMonitorService = require('../services/device-monitor.service');
const AuditService = require('../services/audit.service');
const logger = require('../utils/logger');

class DeviceController {
  async listDevices(req, res) {
    try {
      logger.info('Requisição recebida para listar dispositivos');
      const devices = await DeviceService.getAllDevices(req.user.groups, req.user.accessLevel);
      res.json(devices);
    } catch (error) {
      logger.error('Erro ao listar dispositivos:', error);
      res.status(500).json({ error: 'Erro ao listar dispositivos' });
    }
  }

  async addDevice(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Apenas administradores podem adicionar dispositivos' });
      }

      const device = await DeviceService.addDevice(req.body, req.user.username);
      
      await AuditService.logEvent({
        action: 'device_create',
        username: req.user.username,
        deviceId: device.id,
        deviceName: device.name,
        details: `Dispositivo ${device.name} (${device.ip}) adicionado`
      });

      res.status(201).json(device);
    } catch (error) {
      logger.error('Erro ao adicionar dispositivo:', error);
      res.status(500).json({ error: 'Erro ao adicionar dispositivo' });
    }
  }

  async updateDevice(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Apenas administradores podem editar dispositivos' });
      }

      const device = await DeviceService.updateDevice(
        req.params.id, 
        req.body, 
        req.user.username
      );

      await AuditService.logEvent({
        action: 'device_update',
        username: req.user.username,
        deviceId: device.id,
        deviceName: device.name,
        details: `Dispositivo ${device.name} (${device.ip}) atualizado`
      });

      res.json(device);
    } catch (error) {
      logger.error('Erro ao editar dispositivo:', error);
      
      if (error.message === 'Dispositivo não encontrado') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Erro ao editar dispositivo' });
    }
  }

  async deleteDevice(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Apenas administradores podem excluir dispositivos' });
      }

      const device = await DeviceService.deleteDevice(req.params.id);

      await AuditService.logEvent({
        action: 'device_delete',
        username: req.user.username,
        deviceId: device.id,
        deviceName: device.name,
        details: `Dispositivo ${device.name} (${device.ip}) excluído`
      });

      res.status(204).send();
    } catch (error) {
      logger.error('Erro ao excluir dispositivo:', error);
      
      if (error.message === 'Dispositivo não encontrado') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Erro ao excluir dispositivo' });
    }
  }

  async checkDeviceStatus(req, res) {
    try {
      const statusInfo = await DeviceMonitorService.checkDeviceStatusOnDemand(req.params.id);

      await AuditService.logEvent({
        action: 'status_check',
        username: req.user.username,
        deviceId: req.params.id,
        details: `Verificação manual de status: ${statusInfo.status}, Latência: ${statusInfo.latency}ms`
      });

      res.json(statusInfo);
    } catch (error) {
      logger.error('Erro ao verificar status:', error);
      
      if (error.message === 'Dispositivo não encontrado') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Erro ao verificar status' });
    }
  }

  async getDeviceStatistics(req, res) {
    try {
      const statistics = await DeviceService.getDeviceStatistics();
      res.json(statistics);
    } catch (error) {
      logger.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas dos dispositivos' });
    }
  }

  async getDeviceDetails(req, res) {
    try {
      const device = await DeviceService.getDeviceById(req.params.id);
      const status = DeviceMonitorService.getDeviceStatus(req.params.id);
      
      res.json({
        ...device.toJSON(),
        monitoring: status
      });
    } catch (error) {
      logger.error('Erro ao buscar detalhes do dispositivo:', error);
      
      if (error.message === 'Dispositivo não encontrado') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Erro ao buscar detalhes do dispositivo' });
    }
  }
}

module.exports = new DeviceController();