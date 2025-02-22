const express = require('express');
const router = express.Router();
const DeviceController = require('../controllers/device.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAccessLevel, accessLevels } = require('../middleware/access-control.middleware');
const { apiLimiter } = require('../middleware/rate-limit.middleware');

// Aplicar rate limit e autenticação em todas as rotas
router.use(apiLimiter);
router.use(authMiddleware);

/**
 * @swagger
 * /api/devices/statistics:
 *   get:
 *     summary: Obter estatísticas dos dispositivos
 *     tags: [Dispositivos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas dos dispositivos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 online:
 *                   type: integer
 *                 offline:
 *                   type: integer
 */
router.get('/statistics', DeviceController.getDeviceStatistics);

/**
 * @swagger
 * /api/devices:
 *   get:
 *     summary: Listar todos os dispositivos
 *     tags: [Dispositivos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de dispositivos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Device'
 */
router.get('/', DeviceController.listDevices);

/**
 * @swagger
 * /api/devices/{id}:
 *   get:
 *     summary: Obter detalhes de um dispositivo
 *     tags: [Dispositivos]
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
 *         description: Detalhes do dispositivo
 *       404:
 *         description: Dispositivo não encontrado
 */
router.get('/:id', 
  requireAccessLevel(accessLevels.NOC),
  DeviceController.getDeviceDetails
);

/**
 * @swagger
 * /api/devices/{id}/status:
 *   get:
 *     summary: Verificar status do dispositivo
 *     tags: [Dispositivos]
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
 *         description: Status do dispositivo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [online, offline, unknown]
 *                 latency:
 *                   type: number
 *                 lastCheck:
 *                   type: string
 *                   format: date-time
 */
router.get('/:id/status', 
  requireAccessLevel(accessLevels.NOC),
  DeviceController.checkDeviceStatus
);

/**
 * @swagger
 * /api/devices:
 *   post:
 *     summary: Adicionar novo dispositivo
 *     tags: [Dispositivos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - ip
 *               - manufacturer
 *             properties:
 *               name:
 *                 type: string
 *               ip:
 *                 type: string
 *               port:
 *                 type: integer
 *                 default: 22
 *               manufacturer:
 *                 type: string
 *               model:
 *                 type: string
 *     responses:
 *       201:
 *         description: Dispositivo criado com sucesso
 *       403:
 *         description: Acesso não autorizado
 */
router.post('/', 
  requireAccessLevel(accessLevels.ADMIN),
  DeviceController.addDevice
);

/**
 * @swagger
 * /api/devices/{id}:
 *   put:
 *     summary: Atualizar dispositivo existente
 *     tags: [Dispositivos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Device'
 *     responses:
 *       200:
 *         description: Dispositivo atualizado
 *       404:
 *         description: Dispositivo não encontrado
 */
router.put('/:id', 
  requireAccessLevel(accessLevels.ADMIN),
  DeviceController.updateDevice
);

/**
 * @swagger
 * /api/devices/{id}:
 *   delete:
 *     summary: Excluir dispositivo
 *     tags: [Dispositivos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Dispositivo excluído
 *       404:
 *         description: Dispositivo não encontrado
 */
router.delete('/:id', 
  requireAccessLevel(accessLevels.ADMIN),
  DeviceController.deleteDevice
);

module.exports = router;