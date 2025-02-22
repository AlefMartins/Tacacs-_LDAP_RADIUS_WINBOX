const ReportService = require('../services/report.service');
const AuditService = require('../services/audit.service');
const logger = require('../utils/logger');

class ReportController {
  async generateAccessReport(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Data inicial e final são obrigatórias' });
      }

      const report = await ReportService.generateAccessReport(
        new Date(startDate),
        new Date(endDate)
      );

      await AuditService.logEvent({
        action: 'report_generate',
        username: req.user.username,
        details: `Relatório de acessos gerado: ${report.fileName}`
      });

      res.json(report);
    } catch (error) {
      logger.error('Erro ao gerar relatório de acessos:', error);
      res.status(500).json({ error: 'Erro ao gerar relatório de acessos' });
    }
  }

  async generateDeviceReport(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Data inicial e final são obrigatórias' });
      }

      const report = await ReportService.generateDeviceReport(
        new Date(startDate),
        new Date(endDate)
      );

      await AuditService.logEvent({
        action: 'report_generate',
        username: req.user.username,
        details: `Relatório de dispositivos gerado: ${report.fileName}`
      });

      res.json(report);
    } catch (error) {
      logger.error('Erro ao gerar relatório de dispositivos:', error);
      res.status(500).json({ error: 'Erro ao gerar relatório de dispositivos' });
    }
  }

  async generatePerformanceReport(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Data inicial e final são obrigatórias' });
      }

      const report = await ReportService.generatePerformanceReport(
        new Date(startDate),
        new Date(endDate)
      );

      await AuditService.logEvent({
        action: 'report_generate',
        username: req.user.username,
        details: `Relatório de performance gerado: ${report.fileName}`
      });

      res.json(report);
    } catch (error) {
      logger.error('Erro ao gerar relatório de performance:', error);
      res.status(500).json({ error: 'Erro ao gerar relatório de performance' });
    }
  }

  async generateAuditReport(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Data inicial e final são obrigatórias' });
      }

      const report = await ReportService.generateAuditReport(
        new Date(startDate),
        new Date(endDate)
      );

      await AuditService.logEvent({
        action: 'report_generate',
        username: req.user.username,
        details: `Relatório de auditoria gerado: ${report.fileName}`
      });

      res.json(report);
    } catch (error) {
      logger.error('Erro ao gerar relatório de auditoria:', error);
      res.status(500).json({ error: 'Erro ao gerar relatório de auditoria' });
    }
  }

  async downloadReport(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const { fileName } = req.params;
      const filePath = path.join(ReportService.reportsDir, fileName);

      await AuditService.logEvent({
        action: 'report_download',
        username: req.user.username,
        details: `Download do relatório: ${fileName}`
      });

      res.download(filePath, fileName);
    } catch (error) {
      logger.error('Erro ao baixar relatório:', error);
      res.status(500).json({ error: 'Erro ao baixar relatório' });
    }
  }

  async listReports(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const files = await fs.readdir(ReportService.reportsDir);
      const reports = await Promise.all(
        files
          .filter(file => file.endsWith('.xlsx'))
          .map(async file => {
            const stat = await fs.stat(path.join(ReportService.reportsDir, file));
            return {
              fileName: file,
              size: stat.size,
              created: stat.birthtime,
              type: file.split('_')[0]
            };
          })
      );

      res.json(reports.sort((a, b) => b.created - a.created));
    } catch (error) {
      logger.error('Erro ao listar relatórios:', error);
      res.status(500).json({ error: 'Erro ao listar relatórios' });
    }
  }

  async deleteReport(req, res) {
    try {
      if (req.user.accessLevel < 15) {
        return res.status(403).json({ error: 'Acesso não autorizado' });
      }

      const { fileName } = req.params;
      const filePath = path.join(ReportService.reportsDir, fileName);

      await fs.unlink(filePath);

      await AuditService.logEvent({
        action: 'report_delete',
        username: req.user.username,
        details: `Relatório deletado: ${fileName}`
      });

      res.json({ success: true, fileName });
    } catch (error) {
      logger.error('Erro ao deletar relatório:', error);
      res.status(500).json({ error: 'Erro ao deletar relatório' });
    }
  }
}

module.exports = new ReportController();