const ldap = require('ldapjs');
const { User, Group, Setting } = require('../database/models');
const logger = require('../utils/logger');

class ADSyncService {
  constructor() {
    this.settings = null;
    this.client = null;
  }

  async initialize() {
    try {
      this.settings = await Setting.findOne();
      if (!this.settings) {
        throw new Error('Configurações AD não encontradas');
      }
    } catch (error) {
      logger.error('Erro ao inicializar ADSyncService:', error);
      throw error;
    }
  }

  async connect() {
    this.client = ldap.createClient({
      url: this.settings.ad_url,
      bindDN: this.settings.ad_bind_dn,
      bindCredentials: this.settings.ad_bind_password,
      timeout: 5000,
      connectTimeout: 10000
    });

    return new Promise((resolve, reject) => {
      this.client.bind(this.settings.ad_bind_dn, this.settings.ad_bind_password, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  async syncUser(username) {
    try {
      if (!this.client) await this.connect();

      const userFilter = `(&(objectClass=user)(sAMAccountName=${username}))`;
      const userAttributes = ['sAMAccountName', 'mail', 'memberOf', 'userAccountControl'];

      return new Promise((resolve, reject) => {
        this.client.search(this.settings.ad_base_dn, {
          filter: userFilter,
          attributes: userAttributes,
          scope: 'sub'
        }, async (err, res) => {
          if (err) {
            reject(err);
            return;
          }

          let userData = null;

          res.on('searchEntry', async (entry) => {
            const user = entry.object;
            const groups = Array.isArray(user.memberOf) ? user.memberOf : [user.memberOf];
            
            // Verificar se a conta está ativa no AD
            const userAccountControl = parseInt(user.userAccountControl);
            const isActive = !(userAccountControl & 2); // 2 é o flag ACCOUNTDISABLE

            // Determinar nível de acesso baseado nos grupos
            const accessLevel = await this.determineAccessLevel(groups);

            userData = {
              username: user.sAMAccountName,
              email: user.mail,
              access_level: accessLevel,
              status: isActive ? 'active' : 'inactive',
              ad_groups: groups
            };
          });

          res.on('error', (err) => reject(err));
          
          res.on('end', async () => {
            if (!userData) {
              reject(new Error('Usuário não encontrado no AD'));
              return;
            }

            // Atualizar ou criar usuário no banco local
            const [user, created] = await User.findOrCreate({
              where: { username: userData.username },
              defaults: userData
            });

            if (!created) {
              await user.update(userData);
            }

            // Sincronizar grupos
            await this.syncUserGroups(user, userData.ad_groups);

            resolve(user);
          });
        });
      });
    } catch (error) {
      logger.error('Erro ao sincronizar usuário:', error);
      throw error;
    }
  }

  async syncUserGroups(user, adGroups) {
    try {
      // Converter DNs dos grupos em nomes
      const groupNames = adGroups.map(dn => {
        const match = dn.match(/CN=([^,]+)/);
        return match ? match[1] : null;
      }).filter(Boolean);

      // Sincronizar grupos no banco local
      const groups = await Promise.all(groupNames.map(async groupName => {
        const [group] = await Group.findOrCreate({
          where: { name: groupName },
          defaults: {
            description: `Grupo AD: ${groupName}`,
            access_level: await this.determineGroupAccessLevel(groupName)
          }
        });
        return group;
      }));

      // Atualizar associações do usuário
      await user.setGroups(groups);

    } catch (error) {
      logger.error('Erro ao sincronizar grupos do usuário:', error);
      throw error;
    }
  }

  async determineAccessLevel(adGroups) {
    // Converter DNs em nomes de grupo
    const groupNames = adGroups.map(dn => {
      const match = dn.match(/CN=([^,]+)/);
      return match ? match[1].toUpperCase() : '';
    });

    // Verificar grupos de admin
    if (groupNames.some(name => this.settings.ad_admin_groups.includes(name))) {
      return 15; // Admin
    }

    // Verificar grupos NOC
    if (groupNames.some(name => this.settings.ad_noc_groups.includes(name))) {
      return 10; // NOC
    }

    // Nível padrão
    return 5; // Monitor
  }

  async determineGroupAccessLevel(groupName) {
    const upperGroupName = groupName.toUpperCase();

    if (this.settings.ad_admin_groups.includes(upperGroupName)) {
      return 15;
    }
    if (this.settings.ad_noc_groups.includes(upperGroupName)) {
      return 10;
    }
    return 5;
  }

  disconnect() {
    if (this.client) {
      this.client.unbind();
      this.client = null;
    }
  }
}

module.exports = new ADSyncService();