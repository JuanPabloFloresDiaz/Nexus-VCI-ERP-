const express = require('express');
const router = express.Router();
const DivisasController = require('../controllers/divisas.controller');
const validateRequest = require('../utils/validateRequest');
const { createDivisaSchema, updateDivisaSchema } = require('../validations/divisas.schema');
const { checkAuthAny } = require('../middlewares/checkAuth');

/**
 * @swagger
 * tags:
 *   name: Divisas
 *   description: Gestión del catálogo de divisas
 */

/**
 * @swagger
 * /divisas:
 *   get:
 *     summary: Obtener lista de divisas
 *     tags: [Divisas]
 *     responses:
 *       200:
 *         description: Lista de divisas
 */
router.get('/', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), DivisasController.index);

/**
 * @swagger
 * /divisas/select:
 *   get:
 *     summary: Obtener lista simple para selectores
 *     tags: [Divisas]
 *     responses:
 *       200:
 *         description: Lista de divisas simple
 */
router.get('/select', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), DivisasController.getSelect);

/**
 * @swagger
 * /divisas/trashed:
 *   get:
 *     summary: Obtener divisas eliminadas
 *     tags: [Divisas]
 *     responses:
 *       200:
 *         description: Papelera de divisas
 */
router.get('/trashed', checkAuthAny(['SuperAdmin']), DivisasController.trashed);

/**
 * @swagger
 * /divisas/{id}:
 *   get:
 *     summary: Obtener detalle de una divisa
 *     tags: [Divisas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Datos de la divisa
 */
router.get('/:id', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), DivisasController.getById);

/**
 * @swagger
 * /divisas:
 *   post:
 *     summary: Crear nueva divisa
 *     tags: [Divisas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDivisa'
 *     responses:
 *       201:
 *         description: Divisa creada
 */
router.post('/', checkAuthAny(['SuperAdmin']), validateRequest(createDivisaSchema), DivisasController.store);

/**
 * @swagger
 * /divisas/{id}:
 *   put:
 *     summary: Actualizar divisa
 *     tags: [Divisas]
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
 *             $ref: '#/components/schemas/UpdateDivisa'
 *     responses:
 *       200:
 *         description: Divisa actualizada
 */
router.put('/:id', checkAuthAny(['SuperAdmin']), validateRequest(updateDivisaSchema), DivisasController.update);

/**
 * @swagger
 * /divisas/{id}:
 *   delete:
 *     summary: Eliminar divisa
 *     tags: [Divisas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Divisa eliminada
 */
router.delete('/:id', checkAuthAny(['SuperAdmin']), DivisasController.destroy);

/**
 * @swagger
 * /divisas/{id}/restore:
 *   put:
 *     summary: Restaurar divisa
 *     tags: [Divisas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Divisa restaurada
 */
router.put('/:id/restore', checkAuthAny(['SuperAdmin']), DivisasController.restore);

/**
 * @swagger
 * /divisas/{id}/force:
 *   delete:
 *     summary: Eliminar definitivamente
 *     tags: [Divisas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Eliminado permanentemente
 */
router.delete('/:id/force', checkAuthAny(['SuperAdmin']), DivisasController.forceDestroy);

module.exports = router;
