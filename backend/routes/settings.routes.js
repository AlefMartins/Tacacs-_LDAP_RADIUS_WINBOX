const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/settings.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAccessLevel, accessLevels } = require('../middleware/access-control.middleware');
const { apiLimiter } = require('../middleware/rate-limit.middleware');

// Aplicar rate limit e autenticação em todas as rotas
router.use(apiLimiter);
router.use(authMiddleware);

// Rota pública para validação de senha
router.post('/validate-password', SettingsController.validatePasswordComplexity);

// Rotas que requerem nível NOC ou superior
router.get('/session',
  requireAccessLevel(accessLevels.NOC),
  SettingsController.getSessionSettings
);

// Rotas que requerem nível ADMIN
router.get('/',
  requireAccessLevel(accessLevels.ADMIN),
  SettingsController.getSettings
);

router.put('/',
  requireAccessLevel(accessLevels.ADMIN),
  SettingsController.updateSettings
);

router.post('/test-ad',
  requireAccessLevel(accessLevels.ADMIN),
  SettingsController.testADConnection
);

router.post('/test-tacacs',
  requireAccessLevel(accessLevels.ADMIN),
  SettingsController.testTacacsConnection
);

module.exports = router;