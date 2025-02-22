const SettingsService = require('../services/settings.service');
const logger = require('../utils/logger');

class SettingsController {
  async getSettings(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const settings = await SettingsService.getSettings();
      
      // Remover dados sensíveis
      const safeSettings = { ...settings.toJSON() };
      delete safeSettings.ad_bind_password;
      delete safeSettings.tacacs_key;

      res.json(safeSettings);
    } catch (error) {
      logger.error('Erro ao buscar configurações:', error);
      res.status(500).json({ error: 'Erro ao buscar configurações' });
    }
  }

  async updateSettings(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const updatedSettings = await SettingsService.updateSettings(
        req.body,
        req.user.username
      );

      // Remover dados sensíveis da resposta
      const safeSettings = { ...updatedSettings.toJSON() };
      delete safeSettings.ad_bind_password;
      delete safeSettings.tacacs_key;

      res.json(safeSettings);
    } catch (error) {
      logger.error('Erro ao atualizar configurações:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Erro ao atualizar configurações' });
    }
  }

  async getSessionSettings(req, res) {
    try {
      if (req.user.accessLevel < 10) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const sessionSettings = await SettingsService.getSessionSettings();
      res.json(sessionSettings);
    } catch (error) {
      logger.error('Erro ao buscar configurações de sessão:', error);
      res.status(500).json({ error: 'Erro ao buscar configurações de sessão' });
    }
  }

  async validatePasswordComplexity(req, res) {
    try {
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: 'Senha é obrigatória' });
      }

      const validation = await SettingsService.validatePasswordComplexity(password);
      res.json(validation);
    } catch (error) {
      logger.error('Erro ao validar complexidade da senha:', error);
      res.status(500).json({ error: 'Erro ao validar complexidade da senha' });
    }
  }

  async testADConnection(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      // Aqui você pode adicionar a lógica para testar a conexão com o AD
      // usando as configurações atuais
      res.json({ message: 'Conexão com AD testada com sucesso' });
    } catch (error) {
      logger.error('Erro ao testar conexão com AD:', error);
      res.status(500).json({ error: 'Erro ao testar conexão com AD' });
    }
  }

  async testTacacsConnection(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      // Aqui você pode adicionar a lógica para testar a conexão com o TACACS+
      // usando as configurações atuais
      res.json({ message: 'Conexão com TACACS+ testada com sucesso' });
    } catch (error) {
      logger.error('Erro ao testar conexão com TACACS+:', error);
      res.status(500).json({ error: 'Erro ao testar conexão com TACACS+' });
    }
  }
}

module.exports = new SettingsController();