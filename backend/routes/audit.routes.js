const express = require('express');
const router = express.Router();
const AuditController = require('../controllers/audit.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAccessLevel, accessLevels } = require('../middleware/access-control.middleware');
const { apiLimiter } = require('../middleware/rate-limit.middleware');

router.use(apiLimiter);
router.use(authMiddleware);

/**
 * @swagger
 * /api/audit:
 *   get:
 *     summary: Buscar logs de auditoria
 *     tags: [Auditoria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de logs de auditoria
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuditLog'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 */
router.get('/', requireAccessLevel(accessLevels.ADMIN), AuditController.getLogs);

/**
 * @swagger
 * /api/audit/devices/{deviceId}:
 *   get:
 *     summary: Buscar logs de um dispositivo específico
 *     tags: [Auditoria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Logs do dispositivo
 *       404:
 *         description: Dispositivo não encontrado
 */
router.get('/devices/:deviceId', requireAccessLevel(accessLevels.NOC), AuditController.getDeviceLogs);

/**
 * @swagger
 * /api/audit/users/{username}:
 *   get:
 *     summary: Buscar logs de um usuário específico
 *     tags: [Auditoria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Logs do usuário
 */
router.get('/users/:username', requireAccessLevel(accessLevels.NOC), AuditController.getUserLogs);

/**
 * @swagger
 * /api/audit/commands:
 *   get:
 *     summary: Buscar histórico de comandos executados
 *     tags: [Auditoria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: deviceId
 *         schema:
 *           type: string
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de comandos executados
 */
router.get('/commands', requireAccessLevel(accessLevels.NOC), AuditController.getCommandLogs);

/**
 * @swagger
 * /api/audit/login-history:
 *   get:
 *     summary: Buscar histórico de logins
 *     tags: [Auditoria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Histórico de logins
 */
router.get('/login-history', requireAccessLevel(accessLevels.ADMIN), AuditController.getLoginHistory);

module.exports = router;