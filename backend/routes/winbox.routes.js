const express = require('express');
const router = express.Router();
const WinboxController = require('../controllers/winbox.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/rate-limit.middleware');

router.use(apiLimiter);
router.use(authMiddleware);

/**
 * @swagger
 * /api/winbox/launch/{deviceId}:
 *   post:
 *     summary: Iniciar Winbox para um dispositivo específico
 *     tags: [Winbox]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do dispositivo Mikrotik
 *     responses:
 *       200:
 *         description: Winbox iniciado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       403:
 *         description: Acesso não autorizado
 *       404:
 *         description: Dispositivo não encontrado
 *       400:
 *         description: Dispositivo não é um Mikrotik
 */
router.post('/launch/:deviceId', WinboxController.launchWinbox);

/**
 * @swagger
 * /api/winbox/status:
 *   get:
 *     summary: Verificar status do Winbox
 *     tags: [Winbox]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status do Winbox
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 path:
 *                   type: string
 *                   description: Caminho do executável do Winbox
 *                 version:
 *                   type: string
 *                   description: Versão do Winbox instalado
 *                 isInstalled:
 *                   type: boolean
 *                   description: Se o Winbox está instalado
 */
router.get('/status', WinboxController.checkWinboxStatus);

/**
 * @swagger
 * /api/winbox/download:
 *   get:
 *     summary: Download do executável do Winbox
 *     tags: [Winbox]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Arquivo do Winbox
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Arquivo não encontrado
 */
router.get('/download', WinboxController.downloadWinbox);

/**
 * @swagger
 * /api/winbox/logs/{deviceId}:
 *   get:
 *     summary: Buscar logs de acesso Winbox para um dispositivo
 *     tags: [Winbox]
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
 *         description: Histórico de acessos Winbox
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       username:
 *                         type: string
 *                       status:
 *                         type: string
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 */
router.get('/logs/:deviceId', WinboxController.getAccessLogs);

module.exports = router;