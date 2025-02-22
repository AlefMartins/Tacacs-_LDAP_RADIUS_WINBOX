const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAccessLevel, accessLevels } = require('../middleware/access-control.middleware');
const { apiLimiter } = require('../middleware/rate-limit.middleware');

// Aplicar rate limit e autenticação em todas as rotas
router.use(apiLimiter);
router.use(authMiddleware);

// Todas as rotas requerem nível ADMIN
router.use(requireAccessLevel(accessLevels.ADMIN));

// Rotas para envio de notificações
router.post('/system', NotificationController.sendSystemNotification);
router.post('/user', NotificationController.sendUserNotification);
router.post('/group', NotificationController.sendGroupNotification);
router.post('/broadcast', NotificationController.sendBroadcast);
router.post('/device', NotificationController.sendDeviceNotification);

// Rota para status das conexões
router.get('/status', NotificationController.getConnectionStatus);

module.exports = router;