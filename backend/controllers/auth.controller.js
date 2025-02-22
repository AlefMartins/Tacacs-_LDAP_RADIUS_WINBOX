const AuthService = require('../services/auth.service');
const ADSyncService = require('../services/ad-sync.service');
const SettingService = require('../services/settings.service');
const logger = require('../utils/logger');

class AuthController {
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ 
          error: 'Username e senha são obrigatórios' 
        });
      }

      const result = await AuthService.authenticate(username, password);

      // Incluir configurações do sistema na resposta
      const settings = await SettingService.getPublicSettings();

      res.json({
        ...result,
        settings: {
          logo: settings.getLogoUrl(),
          systemName: settings.system_name,
          theme: settings.default_theme
        }
      });

    } catch (error) {
      logger.error('Erro no login:', error);
      
      const errorMessage = error.message === 'Credenciais inválidas' 
        ? 'Usuário ou senha inválidos'
        : 'Erro ao realizar login';

      res.status(401).json({ error: errorMessage });
    }
  }

  async validateToken(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
      }

      const validation = await AuthService.validateToken(token);

      if (!validation.valid) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
      }

      res.json(validation);
    } catch (error) {
      logger.error('Erro na validação do token:', error);
      res.status(401).json({ error: 'Token inválido' });
    }
  }

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const username = req.user.username;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          error: 'Senha atual e nova senha são obrigatórias' 
        });
      }

      // Validar requisitos de senha
      const settings = await SettingService.getSettings();
      const passwordValidation = await SettingService.validatePasswordComplexity(
        newPassword,
        settings.password_complexity
      );

      if (!passwordValidation.valid) {
        return res.status(400).json({ 
          error: 'A nova senha não atende aos requisitos de complexidade',
          requirements: passwordValidation.requirements
        });
      }

      await AuthService.changePassword(username, currentPassword, newPassword);

      res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
      logger.error('Erro na alteração de senha:', error);
      
      const errorMessage = error.message === 'Credenciais inválidas'
        ? 'Senha atual incorreta'
        : 'Erro ao alterar senha';

      res.status(400).json({ error: errorMessage });
    }
  }

  async refreshUserData(req, res) {
    try {
      const username = req.user.username;

      // Sincronizar dados do usuário com AD
      const user = await ADSyncService.syncUser(username);

      res.json({
        username: user.username,
        email: user.email,
        accessLevel: user.access_level,
        groups: await user.getGroups(),
        preferences: user.preferences
      });
    } catch (error) {
      logger.error('Erro ao atualizar dados do usuário:', error);
      res.status(500).json({ error: 'Erro ao atualizar dados do usuário' });
    }
  }

  async updateUserPreferences(req, res) {
    try {
      const { preferences } = req.body;
      const username = req.user.username;

      // Atualizar preferências no banco local
      const user = await User.findOne({ where: { username } });
      await user.update({ preferences });

      res.json({ 
        message: 'Preferências atualizadas com sucesso',
        preferences: user.preferences
      });
    } catch (error) {
      logger.error('Erro ao atualizar preferências:', error);
      res.status(500).json({ error: 'Erro ao atualizar preferências' });
    }
  }

  async logout(req, res) {
    try {
      // Opcional: implementar invalidação de token se necessário
      res.json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
      logger.error('Erro no logout:', error);
      res.status(500).json({ error: 'Erro ao realizar logout' });
    }
  }
}

module.exports = new AuthController();