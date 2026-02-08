const express = require('express');
const router = express.Router();
const PedidosController = require('../controllers/pedidos.controller');
const { index, trashed, all, store, bulkStore, update, destroy, restore, forceDestroy } = require('../controllers/clientes.controller');
const validateRequest = require('../utils/validateRequest');
const { createClienteSchema, updateClienteSchema, bulkClienteSchema } = require('../validations/clientes.schema');
const { checkAuthAny } = require('../middlewares/checkAuth');

router.use(checkAuthAny());


/**
 * @swagger
 * tags:
 *   name: Clientes
 *   description: API para la gestión de clientes
 */

/**
 * @swagger
 * /clientes:
 *   get:
 *     summary: Obtener listado paginado de clientes (con búsqueda por múltiples campos)
 *     tags: [Clientes]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre, apellido, dui, telefono o correo
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Registros por página
 *     responses:
 *       200:
 *         description: Listado obtenido correctamente
 */
router.get('/', index);

/**
 * @swagger
 * /clientes/trashed:
 *   get:
 *     summary: Obtener clientes en papelera (soft deleted)
 *     tags: [Clientes]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre, apellido, dui, telefono o correo
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *     responses:
 *       200:
 *         description: Listado de papelera obtenido correctamente
 */
router.get('/trashed', trashed);

/**
 * @swagger
 * /clientes/all:
 *   get:
 *     summary: Obtener listado rápido de clientes (id, nombre, apellido)
 *     tags: [Clientes]
 *     responses:
 *       200:
 *         description: Listado rápido obtenido
 */
router.get('/all', all);

/**
 * @swagger
 * /clientes:
 *   post:
 *     summary: Crear un nuevo cliente
 *     tags: [Clientes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCliente'
 *     responses:
 *       201:
 *         description: Cliente creado exitosamente
 */
router.post('/', validateRequest(createClienteSchema), store);

/**
 * @swagger
 * /clientes/bulk:
 *   post:
 *     summary: Creación masiva de clientes
 *     tags: [Clientes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/CreateCliente'
 *     responses:
 *       201:
 *         description: Clientes creados exitosamente
 */
router.post('/bulk', validateRequest(bulkClienteSchema), bulkStore);

/**
 * @swagger
 * /clientes/{id}:
 *   put:
 *     summary: Actualizar un cliente existente
 *     tags: [Clientes]
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
 *             $ref: '#/components/schemas/UpdateCliente'
 *     responses:
 *       200:
 *         description: Cliente actualizado exitosamente
 */
router.put('/:id', validateRequest(updateClienteSchema), update);

/**
 * @swagger
 * /clientes/{id}:
 *   delete:
 *     summary: Eliminar (soft delete) un cliente
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cliente eliminado correctamente (soft delete)
 */
router.delete('/:id', destroy);

/**
 * @swagger
 * /clientes/{id}/restore:
 *   put:
 *     summary: Restaurar un cliente eliminado (soft deleted)
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cliente restaurado correctamente
 */
router.put('/:id/restore', restore);

/**
 * @swagger
 * /clientes/{id}/force:
 *   delete:
 *     summary: Eliminar definitivamente un cliente (Hard Delete)
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cliente eliminado definitivamente
 */
router.delete('/:id/force', forceDestroy);

/**
 * @swagger
 * /clientes/{id}/pedidos:
 *   get:
 *     summary: Obtener historial de pedidos de un cliente
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *       - in: query
 *         name: estado_pedido
 *         schema:
 *           type: string
 *           enum: [Pendiente, Completado, Cancelado]
 *         description: Filtrar por estado
 *       - in: query
 *         name: fecha_desde
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicio (YYYY-MM-DD)
 *       - in: query
 *         name: fecha_hasta
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha fin (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Historial de pedidos obtenido correctamente
 */
router.get('/:id/pedidos', PedidosController.getByCliente);

module.exports = router;
