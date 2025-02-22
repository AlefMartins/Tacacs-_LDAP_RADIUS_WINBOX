const nodemailer = require('nodemailer');
const { Setting } = require('../database/models');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.settings = null;
  }

  async initialize() {
    try {
      this.settings = await Setting.findOne();
      if (!this.settings?.smtp_settings) {
        logger.warn('Configurações SMTP não encontradas');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: this.settings.smtp_settings.host,
        port: this.settings.smtp_settings.port,
        secure: this.settings.smtp_settings.secure,
        auth: {
          user: this.settings.smtp_settings.user,
          pass: this.settings.smtp_settings.password
        }
      });

      logger.info('Serviço de email inicializado');
    } catch (error) {
      logger.error('Erro ao inicializar serviço de email:', error);
      throw error;
    }
  }

  async sendAlerts(recipients, alerts) {
    if (!this.transporter) {
      logger.warn('Serviço de email não configurado');
      return;
    }

    try {
      const mailOptions = {
        from: this.settings.smtp_settings.from,
        to: Array.isArray(recipients) ? recipients.join(',') : recipients,
        subject: 'Alerta do Sistema TACACS+',
        html: this.formatAlertEmail(alerts)
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Alertas enviados para ${recipients}`);
    } catch (error) {
      logger.error('Erro ao enviar email de alerta:', error);
      throw error;
    }
  }

  formatAlertEmail(alerts) {
    return `
      <h2>Alertas do Sistema TACACS+</h2>
      <p>Os seguintes alertas foram detectados:</p>
      <ul>
        ${alerts.map(alert => `
          <li style="color: ${this.getAlertColor(alert.type)}">
            <strong>${alert.type.toUpperCase()}</strong>: ${alert.message}
          </li>
        `).join('')}
      </ul>
      <p>Data: ${new Date().toLocaleString()}</p>
    `;
  }

  getAlertColor(type) {
    const colors = {
      critical: '#ff0000',
      warning: '#ffa500',
      info: '#0000ff'
    };
    return colors[type] || '#000000';
  }

  async sendTest(email) {
    try {
      await this.sendAlerts(email, [{
        type: 'info',
        message: 'Este é um email de teste do sistema TACACS+'
      }]);
      return true;
    } catch (error) {
      logger.error('Erro no teste de email:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();