const express = require('express');
const router = express.Router();
const BackupController = require('../controllers/backup.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAccessLevel, accessLevels } = require('../middleware/access-control.middleware');
const { apiLimiter } = require('../middleware/rate-limit.middleware');

// Aplicar rate limit e autenticação em todas as rotas
router.use(apiLimiter);
router.use(authMiddleware);

// Todas as rotas requerem nível ADMIN
router.use(requireAccessLevel(accessLevels.ADMIN));

/**
 * @swagger
 * /api/backups:
 *   get:
 *     summary: Listar todos os backups
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de backups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   fileName:
 *                     type: string
 *                   size:
 *                     type: number
 *                   created:
 *                     type: string
 *                     format: date-time
 *                   type:
 *                     type: string
 *                     enum: [full, partial]
 */
router.get('/', BackupController.listBackups);

/**
 * @swagger
 * /api/backups/create:
 *   post:
 *     summary: Criar novo backup
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [full, partial]
 *                 default: full
 *     responses:
 *       201:
 *         description: Backup criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fileName:
 *                   type: string
 *                 size:
 *                   type: number
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.post('/create', BackupController.createBackup);

/**
 * @swagger
 * /api/backups/restore/{fileName}:
 *   post:
 *     summary: Restaurar backup
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Backup restaurado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 restoredFiles:
 *                   type: array
 *                   items:
 *                     type: string
 *       404:
 *         description: Arquivo de backup não encontrado
 */
router.post('/restore/:fileName', BackupController.restoreBackup);

/**
 * @swagger
 * /api/backups/{fileName}:
 *   delete:
 *     summary: Excluir backup
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Backup excluído com sucesso
 *       404:
 *         description: Arquivo de backup não encontrado
 */
router.delete('/:fileName', BackupController.deleteBackup);

/**
 * @swagger
 * /api/backups/download/{fileName}:
 *   get:
 *     summary: Download de arquivo de backup
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Arquivo de backup
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Arquivo não encontrado
 */
router.get('/download/:fileName', BackupController.downloadBackup);

/**
 * @swagger
 * /api/backups/schedule:
 *   put:
 *     summary: Atualizar agendamento de backup
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - schedule
 *             properties:
 *               schedule:
 *                 type: string
 *                 description: Expressão cron para agendamento
 *               type:
 *                 type: string
 *                 enum: [full, partial]
 *                 default: full
 *     responses:
 *       200:
 *         description: Agendamento atualizado com sucesso
 */
router.put('/schedule', BackupController.updateBackupSchedule);

module.exports = router;