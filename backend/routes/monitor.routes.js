const express = require('express');
const router = express.Router();
const MonitorController = require('../controllers/monitor.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAccessLevel, accessLevels } = require('../middleware/access-control.middleware');
const { apiLimiter } = require('../middleware/rate-limit.middleware');

router.use(apiLimiter);
router.use(authMiddleware);

/**
 * @swagger
 * /api/monitor/status:
 *   get:
 *     summary: Obter status geral do sistema
 *     tags: [Monitoramento]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status do sistema
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 metrics:
 *                   type: object
 *                   properties:
 *                     cpu:
 *                       type: number
 *                     memory:
 *                       type: number
 *                     disk:
 *                       type: number
 *                 users:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     active:
 *                       type: integer
 *                     admins:
 *                       type: integer
 *                 devices:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     online:
 *                       type: integer
 *                     offline:
 *                       type: integer
 */
router.get('/status', MonitorController.getSystemStatus);

/**
 * @swagger
 * /api/monitor/metrics:
 *   get:
 *     summary: Obter métricas detalhadas
 *     tags: [Monitoramento]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [cpu, memory, disk, network]
 *     responses:
 *       200:
 *         description: Métricas do sistema
 */
router.get('/metrics', requireAccessLevel(accessLevels.NOC), MonitorController.getMetrics);

/**
 * @swagger
 * /api/monitor/users/active:
 *   get:
 *     summary: Listar usuários ativos
 *     tags: [Monitoramento]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários ativos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   username:
 *                     type: string
 *                   lastActivity:
 *                     type: string
 *                     format: date-time
 *                   sessionCount:
 *                     type: integer
 */
router.get('/users/active', requireAccessLevel(accessLevels.NOC), MonitorController.getActiveUsers);

/**
 * @swagger
 * /api/monitor/devices/status:
 *   get:
 *     summary: Status de todos os dispositivos
 *     tags: [Monitoramento]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status dos dispositivos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   status:
 *                     type: string
 *                   latency:
 *                     type: number
 *                   lastCheck:
 *                     type: string
 *                     format: date-time
 */
router.get('/devices/status', MonitorController.getDevicesStatus);

/**
 * @swagger
 * /api/monitor/alerts:
 *   get:
 *     summary: Listar alertas ativos
 *     tags: [Monitoramento]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de alertas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   type:
 *                     type: string
 *                   severity:
 *                     type: string
 *                   message:
 *                     type: string
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 */
router.get('/alerts', requireAccessLevel(accessLevels.NOC), MonitorController.getAlerts);

/**
 * @swagger
 * /api/monitor/alerts/{id}/acknowledge:
 *   post:
 *     summary: Reconhecer um alerta
 *     tags: [Monitoramento]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alerta reconhecido
 */
router.post('/alerts/:id/acknowledge', requireAccessLevel(accessLevels.NOC), MonitorController.acknowledgeAlert);

/**
 * @swagger
 * /api/monitor/performance/history:
 *   get:
 *     summary: Histórico de performance
 *     tags: [Monitoramento]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *           enum: [cpu, memory, disk, network]
 *     responses:
 *       200:
 *         description: Histórico de performance
 */
router.get('/performance/history', requireAccessLevel(accessLevels.NOC), MonitorController.getPerformanceHistory);

module.exports = router;