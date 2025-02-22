const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/report.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAccessLevel, accessLevels } = require('../middleware/access-control.middleware');
const { apiLimiter } = require('../middleware/rate-limit.middleware');

// Aplicar rate limit e autenticação em todas as rotas
router.use(apiLimiter);
router.use(authMiddleware);

// Todas as rotas requerem nível ADMIN
router.use(requireAccessLevel(accessLevels.ADMIN));

// Rotas para geração de relatórios
router.get('/access', ReportController.generateAccessReport);
router.get('/devices', ReportController.generateDeviceReport);
router.get('/performance', ReportController.generatePerformanceReport);
router.get('/audit', ReportController.generateAuditReport);

// Rotas para gerenciamento de relatórios
router.get('/', ReportController.listReports);
router.get('/download/:fileName', ReportController.downloadReport);
router.delete('/:fileName', ReportController.deleteReport);

module.exports = router;