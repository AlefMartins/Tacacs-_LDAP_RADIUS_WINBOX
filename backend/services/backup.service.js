const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const { createReadStream, createWriteStream } = require('fs');
const { Device, Setting, AuditLog } = require('../database/models');
const logger = require('../utils/logger');

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../../backups');
  }

  async initialize() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      logger.error('Erro ao criar diretório de backups:', error);
      throw error;
    }
  }

  async createBackup(type = 'full') {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `backup_${type}_${timestamp}.zip`;
      const backupPath = path.join(this.backupDir, backupFileName);

      const output = createWriteStream(backupPath);
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      archive.pipe(output);

      // Backup das configurações
      const settings = await Setting.findAll();
      archive.append(JSON.stringify(settings, null, 2), { name: 'settings.json' });

      // Backup dos dispositivos
      const devices = await Device.findAll();
      archive.append(JSON.stringify(devices, null, 2), { name: 'devices.json' });

      if (type === 'full') {
        // Backup dos logs de auditoria
        const auditLogs = await AuditLog.findAll();
        archive.append(JSON.stringify(auditLogs, null, 2), { name: 'audit_logs.json' });

        // Backup dos arquivos de log
        const logFiles = ['error.log', 'combined.log'];
        for (const logFile of logFiles) {
          const logPath = path.join(__dirname, '../../logs', logFile);
          try {
            await fs.access(logPath);
            archive.file(logPath, { name: `logs/${logFile}` });
          } catch (error) {
            logger.warn(`Arquivo de log ${logFile} não encontrado`);
          }
        }
      }

      await new Promise((resolve, reject) => {
        output.on('close', resolve);
        archive.on('error', reject);
        archive.finalize();
      });

      return {
        fileName: backupFileName,
        path: backupPath,
        size: archive.pointer(),
        timestamp: new Date(),
        type
      };
    } catch (error) {
      logger.error('Erro ao criar backup:', error);
      throw error;
    }
  }

  async restoreBackup(backupFile) {
    try {
      const backupPath = path.join(this.backupDir, backupFile);
      const extractDir = path.join(this.backupDir, 'temp_restore');
      
      await fs.mkdir(extractDir, { recursive: true });

      // Extrair backup
      await new Promise((resolve, reject) => {
        const unzipper = require('unzipper');
        createReadStream(backupPath)
          .pipe(unzipper.Extract({ path: extractDir }))
          .on('finish', resolve)
          .on('error', reject);
      });

      // Restaurar configurações
      const settingsJson = await fs.readFile(path.join(extractDir, 'settings.json'), 'utf8');
      const settings = JSON.parse(settingsJson);
      await Setting.destroy({ truncate: true });
      await Setting.bulkCreate(settings);

      // Restaurar dispositivos
      const devicesJson = await fs.readFile(path.join(extractDir, 'devices.json'), 'utf8');
      const devices = JSON.parse(devicesJson);
      await Device.destroy({ truncate: true });
      await Device.bulkCreate(devices);

      // Restaurar logs se existirem
      try {
        const logsJson = await fs.readFile(path.join(extractDir, 'audit_logs.json'), 'utf8');
        const logs = JSON.parse(logsJson);
        await AuditLog.destroy({ truncate: true });
        await AuditLog.bulkCreate(logs);
      } catch (error) {
        logger.info('Logs de auditoria não encontrados no backup');
      }

      // Limpar diretório temporário
      await fs.rm(extractDir, { recursive: true });

      return {
        success: true,
        timestamp: new Date(),
        restoredFiles: ['settings', 'devices', 'audit_logs']
      };
    } catch (error) {
      logger.error('Erro ao restaurar backup:', error);
      throw error;
    }
  }

  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups = await Promise.all(
        files
          .filter(file => file.startsWith('backup_') && file.endsWith('.zip'))
          .map(async file => {
            const stat = await fs.stat(path.join(this.backupDir, file));
            return {
              fileName: file,
              size: stat.size,
              created: stat.birthtime,
              type: file.includes('_full_') ? 'full' : 'partial'
            };
          })
      );

      return backups.sort((a, b) => b.created - a.created);
    } catch (error) {
      logger.error('Erro ao listar backups:', error);
      throw error;
    }
  }

  async deleteBackup(fileName) {
    try {
      const backupPath = path.join(this.backupDir, fileName);
      await fs.unlink(backupPath);
      return { success: true, fileName };
    } catch (error) {
      logger.error('Erro ao deletar backup:', error);
      throw error;
    }
  }

  async scheduleBackup(schedule = '0 0 * * *') {
    const cron = require('node-schedule');
    cron.scheduleJob('backup', schedule, async () => {
      try {
        await this.createBackup('full');
        logger.info('Backup automático criado com sucesso');
      } catch (error) {
        logger.error('Erro no backup automático:', error);
      }
    });
  }
}

module.exports = new BackupService();