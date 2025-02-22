const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const axios = require('axios');
const logger = require('../utils/logger');

class WinboxService {
  constructor() {
    this.winboxPath = path.join(process.env.LOCALAPPDATA || '', 'Tacacs', 'winbox');
    this.winboxUrl = 'https://mt.lv/winbox64'; // URL oficial do Winbox
  }

  async initialize() {
    try {
      await fs.mkdir(this.winboxPath, { recursive: true });
    } catch (error) {
      logger.error('Erro ao criar diretório Winbox:', error);
      throw error;
    }
  }

  async ensureWinboxExists() {
    const winboxExePath = path.join(this.winboxPath, 'winbox64.exe');

    try {
      await fs.access(winboxExePath);
    } catch {
      // Winbox não existe, fazer download
      await this.downloadWinbox();
    }

    return winboxExePath;
  }

  async downloadWinbox() {
    const winboxExePath = path.join(this.winboxPath, 'winbox64.exe');

    try {
      const response = await axios({
        method: 'get',
        url: this.winboxUrl,
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(winboxExePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      logger.info('Winbox baixado com sucesso');
    } catch (error) {
      logger.error('Erro ao baixar Winbox:', error);
      throw new Error('Falha ao baixar Winbox');
    }
  }

  async launchWinbox(device, credentials) {
    try {
      const winboxPath = await this.ensureWinboxExists();

      // Validar se é um dispositivo Mikrotik
      if (device.manufacturer.toLowerCase() !== 'mikrotik') {
        throw new Error('Dispositivo não é um Mikrotik');
      }

      // Construir argumentos do Winbox
      const args = [
        device.ip,
        credentials.username,
        credentials.password
      ].map(arg => `"${arg}"`).join(' ');

      // Executar Winbox
      exec(`"${winboxPath}" ${args}`, (error, stdout, stderr) => {
        if (error) {
          logger.error('Erro ao executar Winbox:', error);
          throw error;
        }
      });

      // Registrar acesso
      await this.logWinboxAccess(device, credentials.username);

      return { success: true, message: 'Winbox iniciado com sucesso' };
    } catch (error) {
      logger.error('Erro ao iniciar Winbox:', error);
      throw error;
    }
  }

  async logWinboxAccess(device, username) {
    try {
      await AuditService.logEvent({
        action: 'winbox_access',
        username: username,
        deviceId: device.id,
        deviceName: device.name,
        details: `Acesso via Winbox ao dispositivo ${device.name} (${device.ip})`
      });
    } catch (error) {
      logger.error('Erro ao registrar acesso Winbox:', error);
    }
  }

  async getWinboxVersion() {
    try {
      const winboxPath = await this.ensureWinboxExists();
      // Implementar verificação de versão do executável
      return { path: winboxPath, version: 'latest' };
    } catch (error) {
      logger.error('Erro ao verificar versão do Winbox:', error);
      throw error;
    }
  }
}

module.exports = new WinboxService();