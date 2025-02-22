require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const rateLimit = require('express-rate-limit');
const fileUpload = require('express-fileupload');
const path = require('path');
const logger = require('./utils/logger');

// Importar serviços
const DeviceService = require('./services/device.service');
const ADSyncService = require('./services/ad-sync.service');
const MonitorService = require('./services/monitor.service');
const WinboxService = require('./services/winbox.service');
const BackupService = require('./services/backup.service');
const NotificationService = require('./services/notification.service');
const IntegrationService = require('./services/integration.service');

// Importar configurações
const config = require('./config');

// Importar rotas
const authRoutes = require('./routes/auth.routes');
const deviceRoutes = require('./routes/device.routes');
const auditRoutes = require('./routes/audit.routes');
const winboxRoutes = require('./routes/winbox.routes');
const backupRoutes = require('./routes/backup.routes');
const settingsRoutes = require('./routes/settings.routes');
const reportRoutes = require('./routes/report.routes');
const monitorRoutes = require('./routes/monitor.routes');
const imageRoutes = require('./routes/image.routes');
const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./api-docs');

const PORT = config.server.port || 3001;



// Configurar Express
const app = express();
const server = http.createServer(app);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // limite de 100 requisições por IP
});


// Adicionar antes das rotas da API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middlewares
app.use(limiter);
app.use(cors({
  origin: config.corsOrigins || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  abortOnLimit: true,
  safeFileNames: true,
  preserveExtension: true
}));

// Diretório estático para downloads do Winbox
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/winbox', winboxRoutes);
app.use('/api/backups', backupRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/monitor', monitorRoutes);
app.use('/api/images', imageRoutes);

// Middleware de erro global
app.use((err, req, res, next) => {
  logger.error('Erro não tratado:', err);
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Inicialização dos serviços
async function initializeServices() {
  try {
    // Inicializar serviços principais
    await ADSyncService.initialize();
    await DeviceService.initialize();
    await MonitorService.initialize();
    await WinboxService.initialize();
    await BackupService.initialize();
    await NotificationService.initialize();
    await IntegrationService.initialize();

    // Configurar backup automático
    await BackupService.scheduleBackup('0 0 * * *'); // Backup diário à meia-noite

    // Configurar sincronização com AD
    setInterval(() => {
      ADSyncService.syncAllUsers();
    }, 30 * 60 * 1000); // A cada 30 minutos

    // Configurar limpeza de logs
    setInterval(() => {
      BackupService.cleanOldLogs();
    }, 24 * 60 * 60 * 1000); // Diariamente

    logger.info('Todos os serviços inicializados com sucesso');
  } catch (error) {
    logger.error('Erro ao inicializar serviços:', error);
    throw error;
  }
}

// Inicializar servidor
async function startServer() {
  try {
    // Inicializar serviços
    await initializeServices();

    // Iniciar servidor HTTP
    server.listen(PORT, () => {
      logger.info(`Servidor rodando na porta ${PORT}`);
      logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Versão da API: ${config.apiVersion}`);
    });

    // Tratamento de erros não capturados
    process.on('uncaughtException', (err) => {
      logger.error('Erro não capturado:', err);
    });

    process.on('unhandledRejection', (err) => {
      logger.error('Promise rejeitada não tratada:', err);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM recebido. Iniciando shutdown graceful...');
      server.close(() => {
        logger.info('Servidor HTTP fechado.');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Erro fatal ao inicializar servidor:', error);
    process.exit(1);
  }
}

// Iniciar servidor
startServer();