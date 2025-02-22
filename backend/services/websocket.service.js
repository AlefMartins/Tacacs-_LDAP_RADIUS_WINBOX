const WebSocket = require('ws');
const { Client } = require('ssh2');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');
const TacacsService = require('./tacacs.service');
const AuditService = require('./audit.service');
const DeviceService = require('./device.service');

class WebSocketService {
  constructor() {
    this.activeSessions = new Map();
  }

  initialize(server) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', async (ws, req) => {
      try {
        const { token, deviceId } = this.parseConnectionParams(req);
        const decoded = jwt.verify(token, config.jwt.secret);
        const device = await DeviceService.getDeviceById(deviceId);

        if (!device) {
          ws.close(4000, 'Dispositivo não encontrado');
          return;
        }

        const session = await this.createSession(ws, decoded, device);
        await this.handleSession(ws, session, decoded);

      } catch (error) {
        logger.error('Erro na conexão WebSocket:', error);
        ws.close(4005, 'Erro na autenticação');
      }
    });
  }

  parseConnectionParams(req) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    return {
      token: url.searchParams.get('token'),
      deviceId: url.searchParams.get('deviceId')
    };
  }

  async createSession(ws, decoded, device) {
    // Verificar limite de sessões
    const userSessions = Array.from(this.activeSessions.values())
      .filter(s => s.username === decoded.username);

    if (userSessions.length >= 5) {
      ws.close(4001, 'Limite de sessões excedido');
      throw new Error('Limite de sessões excedido');
    }

    const sessionId = Date.now().toString();
    const session = {
      id: sessionId,
      username: decoded.username,
      deviceId: device.id,
      startTime: new Date(),
      device: device,
      commandBuffer: '',
      lastCommand: null
    };

    this.activeSessions.set(sessionId, session);

    // Iniciar sessão no TACACS+
    await TacacsService.startSession(decoded.username, device);

    // Registrar início da sessão
    await AuditService.logEvent({
      action: 'session_start',
      username: decoded.username,
      deviceId: device.id,
      deviceName: device.name,
      sessionId,
      details: `Iniciada sessão SSH para ${device.name} (${device.ip})`
    });

    return session;
  }

  async handleSession(ws, session, decoded) {
    let inactivityTimeout = this.setupInactivityTimeout(ws);
    const ssh = new Client();

    ssh.on('ready', () => {
      this.setupSSHShell(ws, ssh, session, inactivityTimeout);
    });

    ssh.on('error', (err) => {
      logger.error('Erro SSH:', err);
      ws.close(4004, 'Erro na conexão SSH');
      this.endSession(session, ssh);
    });

    ws.on('close', () => {
      this.endSession(session, ssh);
    });

    // Conectar ao dispositivo
    ssh.connect({
      host: session.device.ip,
      port: session.device.port || 22,
      username: decoded.username,
      password: Buffer.from(decoded.authKey, 'base64').toString(),
      tryKeyboard: true
    });
  }

  setupInactivityTimeout(ws) {
    return setTimeout(() => {
      ws.close(4002, 'Sessão encerrada por inatividade');
    }, 30 * 60 * 1000); // 30 minutos
  }

  setupSSHShell(ws, ssh, session, inactivityTimeout) {
    ssh.shell({ term: 'xterm-256color' }, (err, stream) => {
      if (err) {
        ws.close(4003, 'Erro ao criar shell');
        return;
      }

      stream.on('data', (data) => {
        ws.send(data.toString('utf-8'));
      });

      ws.on('message', async (message) => {
        try {
          clearTimeout(inactivityTimeout);
          inactivityTimeout = this.setupInactivityTimeout(ws);

          const parsed = JSON.parse(message);
          await this.handleMessage(parsed, stream, session, ws);
        } catch (e) {
          logger.error('Erro ao processar mensagem:', e);
        }
      });

      stream.on('close', () => {
        this.endSession(session, ssh);
      });
    });
  }

  async handleMessage(parsed, stream, session, ws) {
    if (parsed.type === 'input') {
      await this.handleInputMessage(parsed, stream, session, ws);
    } else if (parsed.type === 'resize') {
      stream.setWindow(parsed.rows, parsed.cols);
    }
  }

  async handleInputMessage(parsed, stream, session, ws) {
    if (parsed.data === '\r' || parsed.data === '\n') {
      if (session.commandBuffer.trim()) {
        try {
          // Validar comando com TACACS+
          const isAuthorized = await TacacsService.validateCommand(
            session.username,
            session.device,
            session.commandBuffer.trim()
          );

          if (isAuthorized) {
            // Registrar comando executado
            await AuditService.logEvent({
              action: 'command_execute',
              username: session.username,
              deviceId: session.device.id,
              deviceName: session.device.name,
              sessionId: session.id,
              details: `Comando executado: ${session.commandBuffer.trim()}`
            });

            session.lastCommand = session.commandBuffer.trim();
            stream.write(parsed.data);
          } else {
            ws.send('\r\nComando não autorizado pelo TACACS+\r\n');
            await AuditService.logEvent({
              action: 'command_denied',
              username: session.username,
              deviceId: session.device.id,
              deviceName: session.device.name,
              sessionId: session.id,
              details: `Comando negado: ${session.commandBuffer.trim()}`
            });
          }
        } catch (error) {
          logger.error('Erro ao validar comando:', error);
          ws.send('\r\nErro ao validar comando\r\n');
        }
        session.commandBuffer = '';
      } else {
        stream.write(parsed.data);
      }
    } else if (parsed.data === '\u0003') { // Ctrl+C
      session.commandBuffer = '';
      stream.write(parsed.data);
    } else {
      session.commandBuffer += parsed.data;
      stream.write(parsed.data);
    }
  }

  async endSession(session, ssh) {
    try {
      const duration = Date.now() - session.startTime.getTime();
      
      // Finalizar sessão no TACACS+
      await TacacsService.endSession(
        session.username,
        session.device,
        Math.floor(duration / 1000)
      );

      // Registrar fim da sessão
      await AuditService.logEvent({
        action: 'session_end',
        username: session.username,
        deviceId: session.device.id,
        deviceName: session.device.name,
        sessionId: session.id,
        details: `Sessão encerrada. Duração: ${Math.floor(duration / 1000)}s`
      });

      this.activeSessions.delete(session.id);
      ssh.end();
    } catch (error) {
      logger.error('Erro ao encerrar sessão:', error);
    }
  }
}

module.exports = new WebSocketService();