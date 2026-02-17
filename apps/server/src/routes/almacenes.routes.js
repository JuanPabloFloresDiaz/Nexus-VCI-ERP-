const express = require('express');
const router = express.Router();
const AlmacenesController = require('../controllers/almacenes.controller');
const validateRequest = require('../utils/validateRequest');
const { createAlmacenSchema, updateAlmacenSchema } = require('../validations/almacenes.schema');
const { checkAuthAny } = require('../middlewares/checkAuth');

// Prefix: /almacenes (handled by index.js)

/**
 * @swagger
 * tags:
 *   name: Almacenes
 *   description: Gestión de almacenes e inventarios
 */

/**
 * @swagger
 * /almacenes:
 *   get:
 *     summary: Obtener lista de almacenes
 *     tags: [Almacenes]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre o ubicación
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Cantidad por página
 *     responses:
 *       200:
 *         description: Lista de almacenes obtenida correctamente
 */
router.get('/', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), AlmacenesController.index);

/**
 * @swagger
 * /almacenes/trashed:
 *   get:
 *     summary: Obtener almacenes eliminados (Papelera)
 *     tags: [Almacenes]
 *     responses:
 *       200:
 *         description: Papelera obtenida correctamente
 */
router.get('/trashed', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), AlmacenesController.trashed);

/**
 * @swagger
 * /almacenes/{id}:
 *   get:
 *     summary: Obtener detalles de un almacén
 *     tags: [Almacenes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Datos devueltos correctamente
 *       404:
 *         description: Almacén no encontrado
 */
router.get('/:id', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), AlmacenesController.getById);

/**
 * @swagger
 * /almacenes/{id}/stock:
 *   get:
 *     summary: Consultar stock de un almacén
 *     tags: [Almacenes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar producto dentro del almacén
 *     responses:
 *       200:
 *         description: Stock obtenido
 */
router.get('/:id/stock', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), AlmacenesController.getStock);

/**
 * @swagger
 * /almacenes:
 *   post:
 *     summary: Crear un nuevo almacén
 *     tags: [Almacenes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAlmacen'
 *     responses:
 *       201:
 *         description: Almacén creado
 */
router.post('/', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), validateRequest(createAlmacenSchema), AlmacenesController.store);

/**
 * @swagger
 * /almacenes/{id}:
 *   put:
 *     summary: Actualizar un almacén
 *     tags: [Almacenes]
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
 *             $ref: '#/components/schemas/UpdateAlmacen'
 *     responses:
 *       200:
 *         description: Almacén actualizado
 */
router.put('/:id', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), validateRequest(updateAlmacenSchema), AlmacenesController.update);

/**
 * @swagger
 * /almacenes/{id}:
 *   delete:
 *     summary: Eliminar almacén (Soft Delete)
 *     tags: [Almacenes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Almacén eliminado
 */
router.delete('/:id', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), AlmacenesController.destroy);

/**
 * @swagger
 * /almacenes/{id}/restore:
 *   put:
 *     summary: Restaurar almacén eliminado
 *     tags: [Almacenes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Almacén restaurado
 */
router.put('/:id/restore', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), AlmacenesController.restore);

/**
 * @swagger
 * /almacenes/{id}/force:
 *   delete:
 *     summary: Eliminar almacén definitivamente
 *     tags: [Almacenes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Almacén eliminado permanentemente
 */
router.delete('/:id/force', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), AlmacenesController.forceDestroy);

module.exports = router;
