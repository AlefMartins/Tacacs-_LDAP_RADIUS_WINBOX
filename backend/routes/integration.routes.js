const express = require('express');
const router = express.Router();
const IntegrationController = require('../controllers/integration.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAccessLevel, accessLevels } = require('../middleware/access-control.middleware');
const { apiLimiter } = require('../middleware/rate-limit.middleware');

// Aplicar rate limit e autenticação em todas as rotas
router.use(apiLimiter);
router.use(authMiddleware);

// Todas as rotas requerem nível ADMIN
router.use(requireAccessLevel(accessLevels.ADMIN));

// Rotas Webhook
router.get('/webhooks', IntegrationController.listWebhooks);
router.post('/webhooks', IntegrationController.addWebhook);
router.put('/webhooks/:id', IntegrationController.updateWebhook);
router.delete('/webhooks/:id', IntegrationController.deleteWebhook);
router.post('/webhooks/:id/test', IntegrationController.testWebhook);

// Rotas SIEM
router.get('/siem/config', IntegrationController.getSIEMConfig);
router.put('/siem/config', IntegrationController.updateSIEMConfig);
router.post('/siem/test', IntegrationController.testSIEM);

// Rotas de Exportação
router.get('/export/:type', IntegrationController.exportData);

module.exports = router;