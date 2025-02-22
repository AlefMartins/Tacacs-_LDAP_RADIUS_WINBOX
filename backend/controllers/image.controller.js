const ImageService = require('../services/image.service');
const DeviceService = require('../services/device.service');
const SettingService = require('../services/settings.service');
const AuditService = require('../services/audit.service');
const logger = require('../utils/logger');

class ImageController {
  // Manipulação de imagens de dispositivos
  async uploadDeviceImage(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      if (!req.files || !req.files.image) {
        return res.status(400).json({ error: 'Nenhuma imagem fornecida' });
      }

      const { deviceId } = req.params;
      const imageFile = req.files.image;

      const processedImage = await ImageService.optimizeDeviceImage(
        imageFile.data,
        imageFile.mimetype
      );

      await DeviceService.updateDeviceImage(deviceId, {
        image: processedImage.data,
        imageType: processedImage.type
      });

      await AuditService.logEvent({
        action: 'device_image_update',
        username: req.user.username,
        deviceId,
        details: 'Imagem do dispositivo atualizada'
      });

      res.json({ message: 'Imagem do dispositivo atualizada com sucesso' });
    } catch (error) {
      logger.error('Erro ao atualizar imagem do dispositivo:', error);
      res.status(500).json({ error: 'Erro ao atualizar imagem do dispositivo' });
    }
  }

  async getDeviceImage(req, res) {
    try {
      const { deviceId } = req.params;
      const device = await DeviceService.getDeviceById(deviceId);

      if (!device.device_image) {
        const defaultImage = ImageService.getDefaultDeviceImage();
        return res.json(defaultImage);
      }

      res.json({
        data: device.device_image,
        type: device.device_image_type
      });
    } catch (error) {
      logger.error('Erro ao buscar imagem do dispositivo:', error);
      res.status(500).json({ error: 'Erro ao buscar imagem do dispositivo' });
    }
  }

  async deleteDeviceImage(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const { deviceId } = req.params;
      await DeviceService.updateDeviceImage(deviceId, {
        image: null,
        imageType: null
      });

      await AuditService.logEvent({
        action: 'device_image_delete',
        username: req.user.username,
        deviceId,
        details: 'Imagem do dispositivo removida'
      });

      res.json({ message: 'Imagem do dispositivo removida com sucesso' });
    } catch (error) {
      logger.error('Erro ao remover imagem do dispositivo:', error);
      res.status(500).json({ error: 'Erro ao remover imagem do dispositivo' });
    }
  }

  // Manipulação de logo do sistema
  async uploadSystemLogo(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      if (!req.files || !req.files.logo) {
        return res.status(400).json({ error: 'Nenhuma logo fornecida' });
      }

      const logoFile = req.files.logo;
      const processedLogo = await ImageService.optimizeLogo(
        logoFile.data,
        logoFile.mimetype
      );

      await SettingService.updateSystemImages({
        logo: processedLogo.data,
        logoType: processedLogo.type
      });

      await AuditService.logEvent({
        action: 'system_logo_update',
        username: req.user.username,
        details: 'Logo do sistema atualizada'
      });

      res.json({ message: 'Logo do sistema atualizada com sucesso' });
    } catch (error) {
      logger.error('Erro ao atualizar logo do sistema:', error);
      res.status(500).json({ error: 'Erro ao atualizar logo do sistema' });
    }
  }

  async getSystemLogo(req, res) {
    try {
      const settings = await SettingService.getSettings();

      if (!settings.system_logo) {
        const defaultLogo = ImageService.getDefaultLogo();
        return res.json(defaultLogo);
      }

      res.json({
        data: settings.system_logo,
        type: settings.system_logo_type
      });
    } catch (error) {
      logger.error('Erro ao buscar logo do sistema:', error);
      res.status(500).json({ error: 'Erro ao buscar logo do sistema' });
    }
  }

  // Manipulação de favicon
  async uploadSystemFavicon(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      if (!req.files || !req.files.favicon) {
        return res.status(400).json({ error: 'Nenhum favicon fornecido' });
      }

      const faviconFile = req.files.favicon;
      const processedFavicon = await ImageService.processFavicon(
        faviconFile.data,
        faviconFile.mimetype
      );

      await SettingService.updateSystemImages({
        favicon: processedFavicon.data,
        faviconType: processedFavicon.type
      });

      await AuditService.logEvent({
        action: 'system_favicon_update',
        username: req.user.username,
        details: 'Favicon do sistema atualizado'
      });

      res.json({ message: 'Favicon do sistema atualizado com sucesso' });
    } catch (error) {
      logger.error('Erro ao atualizar favicon do sistema:', error);
      res.status(500).json({ error: 'Erro ao atualizar favicon do sistema' });
    }
  }

  async getSystemFavicon(req, res) {
    try {
      const settings = await SettingService.getSettings();

      if (!settings.system_favicon) {
        const defaultFavicon = ImageService.getDefaultFavicon();
        return res.json(defaultFavicon);
      }

      res.json({
        data: settings.system_favicon,
        type: settings.system_favicon_type
      });
    } catch (error) {
      logger.error('Erro ao buscar favicon do sistema:', error);
      res.status(500).json({ error: 'Erro ao buscar favicon do sistema' });
    }
  }
}

module.exports = new ImageController();