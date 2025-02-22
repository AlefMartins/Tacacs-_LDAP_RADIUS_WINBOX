const ldap = require('ldapjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');
const { Setting } = require('../database/models');

class ADAuthService {
  constructor() {
    this.settings = null;
  }

  createLdapClient() {
    return ldap.createClient({
      url: config.ad.url,
      timeout: 5000,
      connectTimeout: 10000,
    });
  }

  async getADSettings() {
    if (!this.settings) {
      this.settings = await Setting.findOne();
      if (!this.settings) {
        throw new Error('Configurações do AD não encontradas');
      }
    }
    return this.settings;
  }

  async authenticate(username, password) {
    const client = this.createLdapClient();
    logger.info(`Tentativa de autenticação para usuário: ${username}`);

    try {
      const settings = await this.getADSettings();
      const cleanUsername = username.replace(`@${settings.ad_domain}`, '');
      const userDN = `${cleanUsername}@${settings.ad_domain}`;

      // Primeiro, autentica o usuário
      await this.bindUser(client, userDN, password);

      // Depois, autentica com a conta de serviço para buscar grupos
      await this.bindServiceAccount(client, settings);

      // Busca os grupos do usuário
      const userGroups = await this.getUserGroups(client, cleanUsername, settings);

      // Verifica permissões
      const { accessLevel, hasPermission } = this.checkPermissions(userGroups);

      if (!hasPermission) {
        throw new Error('Usuário não possui permissão para acessar o sistema');
      }

      // Gera o token JWT
      const token = this.generateToken(cleanUsername, userGroups, accessLevel, password);

      return {
        token,
        userGroups,
        accessLevel,
        username: cleanUsername
      };

    } catch (error) {
      logger.error('Erro na autenticação:', error);
      throw error;
    } finally {
      client.unbind();
    }
  }

  async bindUser(client, userDN, password) {
    return new Promise((resolve, reject) => {
      client.bind(userDN, password, (err) => {
        if (err) {
          logger.error('Erro na autenticação do usuário:', err);
          reject(new Error('Credenciais inválidas'));
          return;
        }
        resolve();
      });
    });
  }

  async bindServiceAccount(client, settings) {
    return new Promise((resolve, reject) => {
      client.bind(settings.ad_bind_dn, settings.ad_bind_password, (err) => {
        if (err) {
          logger.error('Erro na autenticação da conta de serviço:', err);
          reject(new Error('Erro interno de autenticação'));
          return;
        }
        resolve();
      });
    });
  }

  async getUserGroups(client, username, settings) {
    return new Promise((resolve, reject) => {
      const opts = {
        filter: `(&(objectClass=user)(sAMAccountName=${username}))`,
        scope: 'sub',
        attributes: ['memberOf']
      };

      client.search(settings.ad_base_dn, opts, (err, res) => {
        if (err) {
          reject(err);
          return;
        }

        const groups = [];

        res.on('searchEntry', (entry) => {
          if (entry.attributes) {
            const memberOf = entry.attributes.find(attr => attr.type === 'memberOf');
            if (memberOf && memberOf.vals) {
              memberOf.vals.forEach(dn => {
                const match = dn.match(/CN=([^,]+)/i);
                if (match) {
                  groups.push(match[1]);
                }
              });
            }
          }
        });

        res.on('error', (err) => {
          reject(err);
        });

        res.on('end', () => {
          resolve(groups);
        });
      });
    });
  }

  checkPermissions(groups) {
    // Verifica se o usuário pertence a algum grupo permitido
    const hasPermission = groups.some(group => 
      [...config.ad.adminGroups, ...config.ad.nocGroups, ...config.ad.monitorGroups]
        .map(g => g.toUpperCase())
        .includes(group.toUpperCase())
    );

    // Determina o nível de acesso
    let accessLevel = 5; // Nível padrão Monitor
    if (groups.some(g => config.ad.adminGroups.map(a => a.toUpperCase()).includes(g.toUpperCase()))) {
      accessLevel = 15;
    } else if (groups.some(g => config.ad.nocGroups.map(n => n.toUpperCase()).includes(g.toUpperCase()))) {
      accessLevel = 10;
    }

    return { hasPermission, accessLevel };
  }

  generateToken(username, groups, accessLevel, password) {
    return jwt.sign(
      {
        username,
        groups,
        accessLevel,
        authKey: Buffer.from(password).toString('base64')
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  async changePassword(username, currentPassword, newPassword) {
    const client = this.createLdapClient();
    try {
      const settings = await this.getADSettings();
      const userDN = `${username}@${settings.ad_domain}`;

      // Verifica a senha atual
      await this.bindUser(client, userDN, currentPassword);

      // Busca o DN completo do usuário
      const userFullDN = await this.getUserDN(client, username, settings);

      // Altera a senha
      await this.modifyPassword(client, userFullDN, newPassword);

      return true;
    } catch (error) {
      logger.error('Erro na alteração de senha:', error);
      throw error;
    } finally {
      client.unbind();
    }
  }

  async getUserDN(client, username, settings) {
    return new Promise((resolve, reject) => {
      client.search(settings.ad_base_dn, {
        filter: `(&(objectClass=user)(sAMAccountName=${username}))`,
        scope: 'sub',
        attributes: ['distinguishedName']
      }, (err, res) => {
        if (err) {
          reject(err);
          return;
        }

        let userDN = null;

        res.on('searchEntry', (entry) => {
          const dnAttr = entry.attributes.find(a => a.type === 'distinguishedName');
          if (dnAttr && dnAttr.vals && dnAttr.vals.length > 0) {
            userDN = dnAttr.vals[0];
          }
        });

        res.on('end', () => {
          if (!userDN) {
            reject(new Error('Usuário não encontrado'));
            return;
          }
          resolve(userDN);
        });

        res.on('error', (err) => {
          reject(err);
        });
      });
    });
  }

  async modifyPassword(client, userDN, newPassword) {
    return new Promise((resolve, reject) => {
      const newValue = Buffer.from(`"${newPassword}"`, 'utf16le');
      const changes = [
        new ldap.Change({
          operation: 'replace',
          modification: {
            type: 'unicodePwd',
            values: [newValue]
          }
        })
      ];

      client.modify(userDN, changes, (err) => {
        if (err) {
          reject(new Error('Erro ao alterar senha. Verifique os requisitos de complexidade.'));
          return;
        }
        resolve();
      });
    });
  }
}

module.exports = new ADAuthService();