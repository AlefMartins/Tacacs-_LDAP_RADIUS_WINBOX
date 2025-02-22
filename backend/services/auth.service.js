const ldap = require('ldapjs');
const jwt = require('jsonwebtoken');
const { Setting, User } = require('../database/models');
const ADSyncService = require('./ad-sync.service');
const AuditService = require('./audit.service');
const logger = require('../utils/logger');

class AuthService {
  constructor() {
    this.settings = null;
  }

  async initialize() {
    try {
      this.settings = await Setting.findOne();
      if (!this.settings) {
        throw new Error('Configurações do AD não encontradas');
      }
      await ADSyncService.initialize();
    } catch (error) {
      logger.error('Erro ao inicializar AuthService:', error);
      throw error;
    }
  }

  async authenticate(username, password) {
    try {
      const client = ldap.createClient({
        url: this.settings.ad_url,
        timeout: 5000,
        connectTimeout: 10000
      });

      // Limpar o username e formar o userDN
      const cleanUsername = username.replace(`@${this.settings.ad_domain}`, '');
      const userDN = `${cleanUsername}@${this.settings.ad_domain}`;

      // Tentar autenticar o usuário
      await new Promise((resolve, reject) => {
        client.bind(userDN, password, (err) => {
          if (err) {
            logger.error('Erro na autenticação LDAP:', err);
            reject(new Error('Credenciais inválidas'));
            return;
          }
          resolve();
        });
      });

      // Sincronizar usuário com o AD e obter dados atualizados
      const user = await ADSyncService.syncUser(cleanUsername);

      // Verificar se o usuário está ativo
      if (!user.isActive()) {
        throw new Error('Usuário está inativo');
      }

      // Gerar token JWT
      const token = this.generateToken(user);

      // Registrar login bem-sucedido
      await AuditService.logEvent({
        action: 'LOGIN',
        username: user.username,
        details: 'Login bem sucedido',
        status: 'SUCCESS'
      });

      // Atualizar último login
      await user.updateLastLogin();

      return {
        token,
        user: {
          username: user.username,
          email: user.email,
          accessLevel: user.access_level,
          groups: await user.getGroups()
        }
      };

    } catch (error) {
      // Registrar falha de login
      await AuditService.logEvent({
        action: 'LOGIN',
        username: username,
        details: `Falha no login: ${error.message}`,
        status: 'FAILED'
      });

      throw error;
    }
  }

  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        accessLevel: user.access_level
      },
      this.settings.jwt_secret,
      { expiresIn: '8h' }
    );
  }

  async validateToken(token) {
    try {
      const decoded = jwt.verify(token, this.settings.jwt_secret);
      
      // Verificar se o usuário ainda existe e está ativo
      const user = await User.findByPk(decoded.id);
      if (!user || !user.isActive()) {
        throw new Error('Usuário inválido ou inativo');
      }

      return {
        valid: true,
        user: {
          id: user.id,
          username: user.username,
          accessLevel: user.access_level
        }
      };
    } catch (error) {
      logger.error('Erro na validação do token:', error);
      return { valid: false };
    }
  }

  async changePassword(username, currentPassword, newPassword) {
    try {
      // Primeiro, validar a senha atual
      await this.authenticate(username, currentPassword);

      const client = ldap.createClient({
        url: this.settings.ad_url,
        timeout: 5000,
        connectTimeout: 10000
      });

      // Conectar como conta de serviço
      await new Promise((resolve, reject) => {
        client.bind(this.settings.ad_bind_dn, this.settings.ad_bind_password, (err) => {
          if (err) {
            reject(new Error('Erro ao conectar com AD'));
            return;
          }
          resolve();
        });
      });

      // Buscar DN do usuário
      const userDN = await this.findUserDN(client, username);

      // Alterar senha
      await new Promise((resolve, reject) => {
        const changes = [
          new ldap.Change({
            operation: 'replace',
            modification: {
              unicodePwd: this.encodePassword(newPassword)
            }
          })
        ];

        client.modify(userDN, changes, (err) => {
          if (err) {
            reject(new Error('Erro ao alterar senha'));
            return;
          }
          resolve();
        });
      });

      // Registrar alteração de senha
      await AuditService.logEvent({
        action: 'PASSWORD_CHANGE',
        username: username,
        details: 'Senha alterada com sucesso',
        status: 'SUCCESS'
      });

      return true;
    } catch (error) {
      // Registrar falha na alteração de senha
      await AuditService.logEvent({
        action: 'PASSWORD_CHANGE',
        username: username,
        details: `Falha na alteração de senha: ${error.message}`,
        status: 'FAILED'
      });

      throw error;
    }
  }

  async findUserDN(client, username) {
    return new Promise((resolve, reject) => {
      const filter = `(sAMAccountName=${username})`;
      client.search(this.settings.ad_base_dn, {
        filter,
        scope: 'sub',
        attributes: ['dn']
      }, (err, res) => {
        if (err) {
          reject(err);
          return;
        }

        res.on('searchEntry', (entry) => {
          resolve(entry.object.dn);
        });

        res.on('error', reject);

        res.on('end', (result) => {
          if (!result.entries.length) {
            reject(new Error('Usuário não encontrado'));
          }
        });
      });
    });
  }

  encodePassword(password) {
    const passwordBuffer = Buffer.from('"' + password + '"', 'utf16le');
    return passwordBuffer;
  }
}

module.exports = new AuthService();