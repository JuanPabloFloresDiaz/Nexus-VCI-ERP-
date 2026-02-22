const express = require('express');
const router = express.Router();
const TasasCambioController = require('../controllers/tasasCambio.controller');
const validateRequest = require('../utils/validateRequest');
const { createTasaCambioSchema, updateTasaCambioSchema } = require('../validations/tasasCambio.schema');
const { checkAuthAny } = require('../middlewares/checkAuth');

/**
 * @swagger
 * tags:
 *   name: TasasCambio
 *   description: Gestión de paridad cambiaria
 */

/**
 * @swagger
 * /tasas-cambio:
 *   get:
 *     summary: Obtener tasas de cambio
 *     tags: [TasasCambio]
 *     responses:
 *       200:
 *         description: Tasas de cambio
 */
router.get('/', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), TasasCambioController.index);

/**
 * @swagger
 * /tasas-cambio/trashed:
 *   get:
 *     summary: Tasas eliminadas
 *     tags: [TasasCambio]
 *     responses:
 *       200:
 *         description: Papelera
 */
router.get('/trashed', checkAuthAny(['SuperAdmin']), TasasCambioController.trashed);

/**
 * @swagger
 * /tasas-cambio/{id}:
 *   get:
 *     summary: Obtener detalle
 *     tags: [TasasCambio]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Tasa
 */
router.get('/:id', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), TasasCambioController.getById);

/**
 * @swagger
 * /tasas-cambio:
 *   post:
 *     summary: Crear nueva tasa
 *     tags: [TasasCambio]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTasaCambio'
 *     responses:
 *       201:
 *         description: Creada
 */
router.post('/', checkAuthAny(['SuperAdmin']), validateRequest(createTasaCambioSchema), TasasCambioController.store);

/**
 * @swagger
 * /tasas-cambio/{id}:
 *   put:
 *     summary: Actualizar tasa
 *     tags: [TasasCambio]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTasaCambio'
 *     responses:
 *       200:
 *         description: Actualizada
 */
router.put('/:id', checkAuthAny(['SuperAdmin']), validateRequest(updateTasaCambioSchema), TasasCambioController.update);

/**
 * @swagger
 * /tasas-cambio/{id}:
 *   delete:
 *     summary: Eliminar tasa
 *     tags: [TasasCambio]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Eliminada
 */
router.delete('/:id', checkAuthAny(['SuperAdmin']), TasasCambioController.destroy);

/**
 * @swagger
 * /tasas-cambio/{id}/restore:
 *   put:
 *     summary: Restaurar
 *     tags: [TasasCambio]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Restaurada
 */
router.put('/:id/restore', checkAuthAny(['SuperAdmin']), TasasCambioController.restore);

/**
 * @swagger
 * /tasas-cambio/{id}/force:
 *   delete:
 *     summary: Eliminar permanente
 *     tags: [TasasCambio]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Eliminado permanente
 */
router.delete('/:id/force', checkAuthAny(['SuperAdmin']), TasasCambioController.forceDestroy);

module.exports = router;
