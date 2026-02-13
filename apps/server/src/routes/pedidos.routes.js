const express = require('express');
const router = express.Router();

const PedidosController = require('../controllers/pedidos.controller');
const validateRequest = require('../utils/validateRequest');
const { checkAuthAny } = require('../middlewares/checkAuth');
const {
    createPedidoSchema,
    updateEstadoSchema,
    bulkPedidoSchema
} = require('../validations/pedidos.schema');

/**
 * @swagger
 * tags:
 *   name: Pedidos
 *   description: Gestión de pedidos y estados
 */

/**
 * @swagger
 * /pedidos:
 *   get:
 *     summary: Listado paginado de pedidos
 *     tags: [Pedidos]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar
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
router.get('/pedidos', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), PedidosController.index);

/**
 * @swagger
 * /pedidos/trashed:
 *   get:
 *     summary: Obtener pedidos en papelera (soft deleted)
 *     tags: [Pedidos]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *     responses:
 *       200:
 *         description: Listado de papelera obtenido correctamente
 */
router.get('/pedidos/trashed', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), PedidosController.trashed);

/**
 * @swagger
 * /pedidos/{id}:
 *   get:
 *     summary: Obtener pedido por ID (con detalles)
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pedido obtenido correctamente
 */
router.get('/pedidos/:id', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), PedidosController.getById);

/**
 * @swagger
 * /pedidos:
 *   post:
 *     summary: Crear nuevo pedido (con detalles)
 *     tags: [Pedidos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePedido'
 *     responses:
 *       201:
 *         description: Pedido creado exitosamente
 *     security:
 *       - bearerAuth: []
 */
router.post('/pedidos', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), validateRequest(createPedidoSchema), PedidosController.store);

/**
 * @swagger
 * /pedidos/{id}:
 *   put:
 *     summary: Actualizar pedido existente (Full Update)
 *     tags: [Pedidos]
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
 *             $ref: '#/components/schemas/CreatePedido'
 *     responses:
 *       200:
 *         description: Pedido actualizado exitosamente
 */
router.put('/pedidos/:id', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), validateRequest(createPedidoSchema), PedidosController.update);

/**
 * @swagger
 * /pedidos/bulk:
 *   post:
 *     summary: Creación masiva de pedidos
 *     tags: [Pedidos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/CreatePedido'
 *     responses:
 *       201:
 *         description: Pedidos creados exitosamente
 */
router.post('/pedidos/bulk', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), validateRequest(bulkPedidoSchema), PedidosController.bulkStore);

/**
 * @swagger
 * /pedidos/estado/{id}:
 *   patch:
 *     summary: Actualizar estado del pedido
 *     tags: [Pedidos]
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
 *             $ref: '#/components/schemas/UpdateEstadoPedido'
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente
 */
router.patch('/pedidos/estado/:id', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), validateRequest(updateEstadoSchema), PedidosController.updateEstado);

/**
 * @swagger
 * /pedidos/{id}:
 *   delete:
 *     summary: Eliminar (Soft) pedido
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pedido eliminado correctamente
 */
router.delete('/pedidos/:id', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), PedidosController.destroy);

router.put('/pedidos/:id/restore', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), PedidosController.restore);
router.delete('/pedidos/:id/force', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), PedidosController.forceDestroy);

module.exports = router;
