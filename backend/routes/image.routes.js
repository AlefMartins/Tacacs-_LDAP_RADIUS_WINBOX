const express = require('express');
const router = express.Router();
const ImageController = require('../controllers/image.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAccessLevel, accessLevels } = require('../middleware/access-control.middleware');
const { apiLimiter } = require('../middleware/rate-limit.middleware');

// Aplicar rate limit e autenticação em todas as rotas
router.use(apiLimiter);
router.use(authMiddleware);

// Rotas para imagens de dispositivos
router.get('/devices/:deviceId', ImageController.getDeviceImage);

// Rotas que requerem nível ADMIN
router.use(requireAccessLevel(accessLevels.ADMIN));

router.post('/devices/:deviceId', ImageController.uploadDeviceImage);
router.delete('/devices/:deviceId', ImageController.deleteDeviceImage);

// Rotas para logo e favicon do sistema
router.get('/system/logo', ImageController.getSystemLogo);
router.post('/system/logo', ImageController.uploadSystemLogo);

router.get('/system/favicon', ImageController.getSystemFavicon);
router.post('/system/favicon', ImageController.uploadSystemFavicon);

module.exports = router;