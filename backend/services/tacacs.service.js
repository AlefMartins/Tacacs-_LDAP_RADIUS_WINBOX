const tacacs = require('tacacs-plus');
const logger = require('../utils/logger');
const { Setting } = require('../database/models');

class TacacsService {
  constructor() {
    this.settings = null;
    this.client = null;
  }

  async initialize() {
    try {
      this.settings = await Setting.findOne();
      if (!this.settings) {
        throw new Error('Configurações TACACS+ não encontradas');
      }

      this.client = new tacacs.Client({
        host: this.settings.tacacs_server_ip,
        key: this.settings.tacacs_key,
        timeout: 10
      });

      logger.info('Serviço TACACS+ inicializado com sucesso');
    } catch (error) {
      logger.error('Erro ao inicializar serviço TACACS+:', error);
      throw error;
    }
  }

  async authenticate(username, password) {
    if (!this.client) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      this.client.authenticate({
        username,
        password,
        authenType: tacacs.AUTHEN_TYPES.ASCII,
        authenService: tacacs.AUTHEN_SERVICES.LOGIN,
        protocol: tacacs.AUTHEN_PROTOCOLS.NONE,
      }, (err, result) => {
        if (err) {
          logger.error('Erro na autenticação TACACS+:', err);
          reject(err);
          return;
        }

        if (!result.isValid) {
          reject(new Error('Credenciais inválidas'));
          return;
        }

        resolve(result);
      });
    });
  }

  async authorize(username, command, args = []) {
    if (!this.client) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      this.client.authorize({
        username,
        args: [command, ...args],
        service: tacacs.AUTHEN_SERVICES.LOGIN,
        protocol: tacacs.AUTHEN_PROTOCOLS.NONE,
      }, (err, result) => {
        if (err) {
          logger.error('Erro na autorização TACACS+:', err);
          reject(err);
          return;
        }

        resolve(result.isPermitted);
      });
    });
  }

  async accounting(username, command, args = [], type = 'start') {
    if (!this.client) {
      await this.initialize();
    }

    const acctType = type === 'start' ? 
      tacacs.ACCT_FLAGS.START : 
      tacacs.ACCT_FLAGS.STOP;

    return new Promise((resolve, reject) => {
      this.client.account({
        username,
        args: [command, ...args],
        service: tacacs.AUTHEN_SERVICES.LOGIN,
        protocol: tacacs.AUTHEN_PROTOCOLS.NONE,
        type: acctType,
      }, (err) => {
        if (err) {
          logger.error('Erro no accounting TACACS+:', err);
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  async startSession(username, device) {
    try {
      await this.accounting(username, 'SESSION_START', [
        `device=${device.name}`,
        `ip=${device.ip}`,
        `port=${device.port || 22}`
      ], 'start');

      logger.info(`Sessão TACACS+ iniciada para ${username} em ${device.name}`);
    } catch (error) {
      logger.error('Erro ao iniciar sessão TACACS+:', error);
      throw error;
    }
  }

  async endSession(username, device, duration) {
    try {
      await this.accounting(username, 'SESSION_END', [
        `device=${device.name}`,
        `ip=${device.ip}`,
        `duration=${duration}`,
        `port=${device.port || 22}`
      ], 'stop');

      logger.info(`Sessão TACACS+ finalizada para ${username} em ${device.name}`);
    } catch (error) {
      logger.error('Erro ao finalizar sessão TACACS+:', error);
      throw error;
    }
  }

  async validateCommand(username, device, command) {
    try {
      const isAuthorized = await this.authorize(username, command, [
        `device=${device.name}`,
        `ip=${device.ip}`
      ]);

      if (isAuthorized) {
        await this.accounting(username, command, [
          `device=${device.name}`,
          `ip=${device.ip}`,
          'status=authorized'
        ]);
      } else {
        await this.accounting(username, command, [
          `device=${device.name}`,
          `ip=${device.ip}`,
          'status=denied'
        ]);
      }

      return isAuthorized;
    } catch (error) {
      logger.error('Erro na validação do comando:', error);
      throw error;
    }
  }

  async getCommandHistory(username, deviceId) {
    try {
      // Implementar busca no histórico de comandos
      // Esta é uma funcionalidade que depende da sua implementação específica
      return [];
    } catch (error) {
      logger.error('Erro ao buscar histórico de comandos:', error);
      throw error;
    }
  }
}

module.exports = new TacacsService();