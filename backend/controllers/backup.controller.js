const BackupService = require('../services/backup.service');
const logger = require('../utils/logger');
const AuditService = require('../services/audit.service');

class BackupController {
  async createBackup(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const { type = 'full' } = req.query;
      const backup = await BackupService.createBackup(type);

      await AuditService.logEvent({
        action: 'backup_create',
        username: req.user.username,
        details: `Backup criado: ${backup.fileName} (${backup.type})`
      });

      res.json(backup);
    } catch (error) {
      logger.error('Erro ao criar backup:', error);
      res.status(500).json({ error: 'Erro ao criar backup' });
    }
  }

  async restoreBackup(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const { fileName } = req.params;

      await AuditService.logEvent({
        action: 'backup_restore_start',
        username: req.user.username,
        details: `Iniciando restauração do backup: ${fileName}`
      });

      const result = await BackupService.restoreBackup(fileName);

      await AuditService.logEvent({
        action: 'backup_restore_complete',
        username: req.user.username,
        details: `Restauração do backup concluída: ${fileName}`
      });

      res.json(result);
    } catch (error) {
      logger.error('Erro ao restaurar backup:', error);

      await AuditService.logEvent({
        action: 'backup_restore_failed',
        username: req.user.username,
        details: `Falha na restauração do backup: ${error.message}`
      });

      res.status(500).json({ error: 'Erro ao restaurar backup' });
    }
  }

  async listBackups(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const backups = await BackupService.listBackups();
      res.json(backups);
    } catch (error) {
      logger.error('Erro ao listar backups:', error);
      res.status(500).json({ error: 'Erro ao listar backups' });
    }
  }

  async deleteBackup(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const { fileName } = req.params;
      const result = await BackupService.deleteBackup(fileName);

      await AuditService.logEvent({
        action: 'backup_delete',
        username: req.user.username,
        details: `Backup deletado: ${fileName}`
      });

      res.json(result);
    } catch (error) {
      logger.error('Erro ao deletar backup:', error);
      res.status(500).json({ error: 'Erro ao deletar backup' });
    }
  }

  async downloadBackup(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const { fileName } = req.params;
      const filePath = path.join(BackupService.backupDir, fileName);

      await AuditService.logEvent({
        action: 'backup_download',
        username: req.user.username,
        details: `Backup baixado: ${fileName}`
      });

      res.download(filePath, fileName);
    } catch (error) {
      logger.error('Erro ao baixar backup:', error);
      res.status(500).json({ error: 'Erro ao baixar backup' });
    }
  }

  async updateBackupSchedule(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const { schedule } = req.body;
      
      if (!schedule) {
        return res.status(400).json({ error: 'Cronograma é obrigatório' });
      }

      await BackupService.scheduleBackup(schedule);

      await AuditService.logEvent({
        action: 'backup_schedule_update',
        username: req.user.username,
        details: `Cronograma de backup atualizado: ${schedule}`
      });

      res.json({ message: 'Cronograma de backup atualizado com sucesso' });
    } catch (error) {
      logger.error('Erro ao atualizar cronograma de backup:', error);
      res.status(500).json({ error: 'Erro ao atualizar cronograma de backup' });
    }
  }
}

module.exports = new BackupController();