const express = require('express');
const router = express.Router();
const SessionController = require('../controllers/session.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAccessLevel, accessLevels } = require('../middleware/access-control.middleware');
const { apiLimiter } = require('../middleware/rate-limit.middleware');

// Aplicar rate limit e autenticação em todas as rotas
router.use(apiLimiter);
router.use(authMiddleware);

// Rotas para usuário comum
router.get('/my-sessions', SessionController.getUserSessions);
router.delete('/my-sessions/:sessionId', SessionController.endSession);

// Rotas que requerem nível NOC ou superior
router.get('/devices/:deviceId',
  requireAccessLevel(accessLevels.NOC),
  SessionController.getDeviceSessions
);

router.get('/history',
  requireAccessLevel(accessLevels.NOC),
  SessionController.getSessionHistory
);

// Rotas que requerem nível ADMIN
router.get('/stats',
  requireAccessLevel(accessLevels.ADMIN),
  SessionController.getSessionStats
);

router.delete('/users/:username',
  requireAccessLevel(accessLevels.ADMIN),
  SessionController.endAllUserSessions
);

router.delete('/devices/:deviceId',
  requireAccessLevel(accessLevels.ADMIN),
  SessionController.endAllDeviceSessions
);

module.exports = router;