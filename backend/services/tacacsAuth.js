// /var/www/tacacs-ui/backend/services/tacacsAuth.js

const tacacs = require('tacacs-plus');
const config = require('../config');
const logger = require('../utils/logger');

class TacacsAuthService {
  constructor() {
    this.tacacsConfig = {
      host: config.tacacs.serverIP,
      key: config.tacacs.key,
      timeout: 10
    };
  }

  async authenticate(username, password, deviceInfo) {
    return new Promise((resolve, reject) => {
      const client = new tacacs.Client(this.tacacsConfig);

      client.authorize({
        username,
        password,
        service: 'shell',
        protocol: 'ssh',
        remote_address: deviceInfo.ip,
        cmd: '',
        port: deviceInfo.port.toString()
      }, (err, result) => {
        if (err) {
          logger.error('Erro na autenticação TACACS+:', {
            error: err.message,
            username,
            deviceIp: deviceInfo.ip
          });
          reject(err);
          return;
        }

        if (!result.isAuthorized) {
          logger.warn('Acesso não autorizado via TACACS+:', {
            username,
            deviceIp: deviceInfo.ip
          });
          reject(new Error('Acesso não autorizado'));
          return;
        }

        // Mapear nível de privilégio do TACACS+
        const privLevel = parseInt(result.privLevel || '1');
        
        logger.info('Autenticação TACACS+ bem-sucedida:', {
          username,
          deviceIp: deviceInfo.ip,
          privLevel
        });

        resolve({
          authorized: true,
          privLevel,
          attributes: result.attributes
        });
      });
    });
  }

  async startAccounting(sessionId, username, deviceInfo) {
    return new Promise((resolve, reject) => {
      const client = new tacacs.Client(this.tacacsConfig);

      const recordData = {
        sessionId,
        username,
        service: 'shell',
        protocol: 'ssh',
        remote_address: deviceInfo.ip,
        port: deviceInfo.port.toString(),
        start_time: new Date(),
        action: 'start'
      };

      client.account(recordData, (err) => {
        if (err) {
          logger.error('Erro ao iniciar accounting TACACS+:', {
            error: err.message,
            sessionId,
            username,
            deviceIp: deviceInfo.ip
          });
          reject(err);
          return;
        }

        logger.info('Accounting TACACS+ iniciado:', {
          sessionId,
          username,
          deviceIp: deviceInfo.ip
        });
        resolve(true);
      });
    });
  }

  async stopAccounting(sessionId, username, deviceInfo, duration) {
    return new Promise((resolve, reject) => {
      const client = new tacacs.Client(this.tacacsConfig);

      const recordData = {
        sessionId,
        username,
        service: 'shell',
        protocol: 'ssh',
        remote_address: deviceInfo.ip,
        port: deviceInfo.port.toString(),
        stop_time: new Date(),
        duration,
        action: 'stop'
      };

      client.account(recordData, (err) => {
        if (err) {
          logger.error('Erro ao finalizar accounting TACACS+:', {
            error: err.message,
            sessionId,
            username,
            deviceIp: deviceInfo.ip
          });
          reject(err);
          return;
        }

        logger.info('Accounting TACACS+ finalizado:', {
          sessionId,
          username,
          deviceIp: deviceInfo.ip,
          duration
        });
        resolve(true);
      });
    });
  }
}

module.exports = new TacacsAuthService();
