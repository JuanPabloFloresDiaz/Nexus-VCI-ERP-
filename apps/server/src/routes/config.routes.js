const express = require('express');
const router = express.Router();
const ConfiguracionesGlobalesController = require('../controllers/configuracionesGlobales.controller');
const validateRequest = require('../utils/validateRequest');
const { updateConfiguracionGlobalSchema } = require('../validations/configuracionesGlobales.schema');
const { checkAuthAny } = require('../middlewares/checkAuth');

/**
 * @swagger
 * tags:
 *   name: Config
 *   description: Configuraciones globales de la empresa
 */

/**
 * @swagger
 * /config:
 *   get:
 *     summary: Obtener configuración global de la empresa
 *     tags: [Config]
 *     responses:
 *       200:
 *         description: Configuración
 */
router.get('/', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), ConfiguracionesGlobalesController.get);

/**
 * @swagger
 * /config:
 *   put:
 *     summary: Actualizar divisa base
 *     tags: [Config]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateConfiguracionGlobal'
 *     responses:
 *       200:
 *         description: Configuración actualizada
 */
router.put('/', checkAuthAny(['SuperAdmin', 'Administrador']), validateRequest(updateConfiguracionGlobalSchema), ConfiguracionesGlobalesController.update);

/**
 * @swagger
 * /config/sync-rates:
 *   post:
 *     summary: Sincronizar tasas de cambio con API externa
 *     tags: [Config]
 *     responses:
 *       200:
 *         description: Tasas sincronizadas
 */
router.post('/sync-rates', checkAuthAny(['SuperAdmin']), ConfiguracionesGlobalesController.syncRates);

module.exports = router;
