const WinboxService = require('../services/winbox.service');
const DeviceService = require('../services/device.service');
const logger = require('../utils/logger');

class WinboxController {
  async launchWinbox(req, res) {
    try {
      const { deviceId } = req.params;
      const device = await DeviceService.getDeviceById(deviceId);

      if (!device) {
        return res.status(404).json({ error: 'Dispositivo não encontrado' });
      }

      // Verificar se usuário tem acesso ao dispositivo
      const hasAccess = await DeviceService.checkUserAccess(req.user, device);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Acesso não autorizado a este dispositivo' });
      }

      // Preparar credenciais (usando as do usuário logado)
      const credentials = {
        username: req.user.username,
        password: Buffer.from(req.user.authKey, 'base64').toString()
      };

      const result = await WinboxService.launchWinbox(device, credentials);
      res.json(result);
    } catch (error) {
      logger.error('Erro ao iniciar Winbox:', error);
      res.status(500).json({ error: 'Erro ao iniciar Winbox' });
    }
  }

  async checkWinboxStatus(req, res) {
    try {
      const status = await WinboxService.getWinboxVersion();
      res.json(status);
    } catch (error) {
      logger.error('Erro ao verificar status do Winbox:', error);
      res.status(500).json({ error: 'Erro ao verificar status do Winbox' });
    }
  }
}

module.exports = new WinboxController();