const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const config = require('../config');

class NotificationService {
  constructor() {
    this.clients = new Map(); // userId -> WebSocket
    this.userGroups = new Map(); // userId -> [groups]
    this.wss = null;
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/api/notifications'
    });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    logger.info('Serviço de notificações inicializado');
  }

  handleConnection(ws, req) {
    try {
      const token = this.extractToken(req);
      const decoded = jwt.verify(token, config.jwt.secret);

      this.clients.set(decoded.username, ws);
      this.userGroups.set(decoded.username, decoded.groups);

      ws.on('close', () => {
        this.clients.delete(decoded.username);
        this.userGroups.delete(decoded.username);
      });

      // Enviar mensagem de conexão bem-sucedida
      this.sendToUser(decoded.username, {
        type: 'connection',
        message: 'Conectado ao sistema de notificações'
      });

    } catch (error) {
      logger.error('Erro na conexão WebSocket:', error);
      ws.close();
    }
  }

  extractToken(req) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    return url.searchParams.get('token');
  }

  sendToUser(username, notification) {
    try {
      const client = this.clients.get(username);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          ...notification,
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      logger.error(`Erro ao enviar notificação para ${username}:`, error);
    }
  }

  sendToGroup(group, notification) {
    for (const [username, groups] of this.userGroups.entries()) {
      if (groups.includes(group)) {
        this.sendToUser(username, notification);
      }
    }
  }

  sendToAll(notification) {
    for (const username of this.clients.keys()) {
      this.sendToUser(username, notification);
    }
  }

  notifyDeviceStatus(device, status, previousStatus) {
    // Notificar mudança de status para usuários relevantes
    const notification = {
      type: 'device_status',
      deviceId: device.id,
      deviceName: device.name,
      status: status,
      previousStatus: previousStatus,
      message: `Status do dispositivo ${device.name} alterado de ${previousStatus} para ${status}`
    };

    // Enviar para grupos que têm acesso ao dispositivo
    device.groups.forEach(group => {
      this.sendToGroup(group, notification);
    });
  }

  notifyLoginAttempt(username, success, ipAddress) {
    // Notificar administradores sobre tentativas de login
    if (!success) {
      const notification = {
        type: 'login_attempt',
        username,
        success,
        ipAddress,
        message: `Tentativa de login malsucedida para ${username} de ${ipAddress}`
      };

      for (const [user, groups] of this.userGroups.entries()) {
        if (groups.some(g => config.ad.adminGroups.includes(g))) {
          this.sendToUser(user, notification);
        }
      }
    }
  }

  notifyCommandExecution(username, device, command) {
    // Notificar sobre execução de comandos críticos
    const notification = {
      type: 'command_execution',
      username,
      deviceId: device.id,
      deviceName: device.name,
      command,
      message: `Comando executado em ${device.name} por ${username}: ${command}`
    };

    // Enviar para administradores e NOC
    for (const [user, groups] of this.userGroups.entries()) {
      if (groups.some(g => [...config.ad.adminGroups, ...config.ad.nocGroups].includes(g))) {
        this.sendToUser(user, notification);
      }
    }
  }

  notifySystemEvent(eventType, message) {
    const notification = {
      type: 'system_event',
      eventType,
      message
    };

    // Enviar para administradores
    for (const [user, groups] of this.userGroups.entries()) {
      if (groups.some(g => config.ad.adminGroups.includes(g))) {
        this.sendToUser(user, notification);
      }
    }
  }

  notifySessionTimeout(username, deviceName) {
    this.sendToUser(username, {
      type: 'session_timeout',
      deviceName,
      message: `Sua sessão em ${deviceName} será encerrada por inatividade em 5 minutos`
    });
  }
}

module.exports = new NotificationService();