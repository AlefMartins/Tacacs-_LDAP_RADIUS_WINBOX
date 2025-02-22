const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/rate-limit.middleware');

// Aplicar rate limit em todas as rotas
router.use(apiLimiter);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Autenticar usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login bem sucedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                     accessLevel:
 *                       type: integer
 *                     groups:
 *                       type: array
 *                       items:
 *                         type: string
 *       401:
 *         description: Credenciais inválidas
 */
router.post('/login', AuthController.login);

// Rotas protegidas (requerem autenticação)
router.use(authMiddleware);

/**
 * @swagger
 * /api/auth/validate:
 *   get:
 *     summary: Validar token JWT
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 user:
 *                   type: object
 *       401:
 *         description: Token inválido
 */
router.get('/validate', AuthController.validateToken);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Alterar senha do usuário
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
 *       400:
 *         description: Erro na alteração de senha
 */
router.post('/change-password', AuthController.changePassword);

/**
 * @swagger
 * /api/auth/refresh:
 *   get:
 *     summary: Atualizar dados do usuário
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário atualizados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 accessLevel:
 *                   type: integer
 *                 groups:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/refresh', AuthController.refreshUserData);

/**
 * @swagger
 * /api/auth/preferences:
 *   put:
 *     summary: Atualizar preferências do usuário
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               preferences:
 *                 type: object
 *     responses:
 *       200:
 *         description: Preferências atualizadas
 *       400:
 *         description: Erro ao atualizar preferências
 */
router.put('/preferences', AuthController.updateUserPreferences);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Realizar logout do usuário
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 */
router.post('/logout', AuthController.logout);

module.exports = router;