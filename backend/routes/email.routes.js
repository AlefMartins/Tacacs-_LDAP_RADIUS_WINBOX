const express = require('express');
const router = express.Router();
const EmailController = require('../controllers/email.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAccessLevel, accessLevels } = require('../middleware/access-control.middleware');
const { apiLimiter } = require('../middleware/rate-limit.middleware');

router.use(apiLimiter);
router.use(authMiddleware);
router.use(requireAccessLevel(accessLevels.ADMIN));

/**
 * @swagger
 * /api/email/settings:
 *   get:
 *     summary: Obter configurações de email
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configurações de email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 smtp_host:
 *                   type: string
 *                 smtp_port:
 *                   type: integer
 *                 smtp_user:
 *                   type: string
 *                 smtp_secure:
 *                   type: boolean
 *                 from_email:
 *                   type: string
 */
router.get('/settings', EmailController.getEmailSettings);

/**
 * @swagger
 * /api/email/settings:
 *   put:
 *     summary: Atualizar configurações de email
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - smtp_host
 *               - smtp_port
 *               - smtp_user
 *               - smtp_password
 *             properties:
 *               smtp_host:
 *                 type: string
 *               smtp_port:
 *                 type: integer
 *               smtp_user:
 *                 type: string
 *               smtp_password:
 *                 type: string
 *               smtp_secure:
 *                 type: boolean
 *               from_email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Configurações atualizadas com sucesso
 */
router.put('/settings', EmailController.updateEmailSettings);

/**
 * @swagger
 * /api/email/test:
 *   post:
 *     summary: Enviar email de teste
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - test_email
 *             properties:
 *               test_email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email de teste enviado com sucesso
 */
router.post('/test', EmailController.testEmailSettings);

/**
 * @swagger
 * /api/email/templates:
 *   get:
 *     summary: Obter templates de email
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de templates de email
 */
router.get('/templates', EmailController.getEmailTemplates);

/**
 * @swagger
 * /api/email/templates:
 *   put:
 *     summary: Atualizar template de email
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - subject
 *               - body
 *             properties:
 *               type:
 *                 type: string
 *               subject:
 *                 type: string
 *               body:
 *                 type: string
 *     responses:
 *       200:
 *         description: Template atualizado com sucesso
 */
router.put('/templates', EmailController.updateEmailTemplate);

/**
 * @swagger
 * /api/email/alert-recipients:
 *   post:
 *     summary: Adicionar destinatário de alerta
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - alert_types
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               alert_types:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Destinatário adicionado com sucesso
 */
router.post('/alert-recipients', EmailController.addAlertRecipient);

/**
 * @swagger
 * /api/email/alert-recipients/{email}:
 *   delete:
 *     summary: Remover destinatário de alerta
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Destinatário removido com sucesso
 */
router.delete('/alert-recipients/:email', EmailController.removeAlertRecipient);

module.exports = router;