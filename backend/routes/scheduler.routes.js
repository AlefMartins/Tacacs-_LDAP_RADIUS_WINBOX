const express = require('express');
const router = express.Router();
const SchedulerController = require('../controllers/scheduler.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAccessLevel, accessLevels } = require('../middleware/access-control.middleware');
const { apiLimiter } = require('../middleware/rate-limit.middleware');

// Aplicar rate limit e autenticação em todas as rotas
router.use(apiLimiter);
router.use(authMiddleware);

// Todas as rotas requerem nível ADMIN
router.use(requireAccessLevel(accessLevels.ADMIN));

// Rotas para gerenciamento dos jobs
router.get('/status', SchedulerController.getStatus);
router.put('/update', SchedulerController.updateJobSchedule);
router.post('/:jobName/stop', SchedulerController.stopJob);
router.post('/:jobName/start', SchedulerController.startJob);
router.post('/:jobName/run-now', SchedulerController.runJobNow);

module.exports = router;