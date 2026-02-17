const express = require('express');
const router = express.Router();
const MovimientosController = require('../controllers/movimientos.controller');
const validateRequest = require('../utils/validateRequest');
const { createMovimientoSchema, transferenciaSchema } = require('../validations/movimientos.schema');
const { checkAuthAny } = require('../middlewares/checkAuth');

// Prefix: /movimientos

/**
 * @swagger
 * tags:
 *   name: Movimientos
 *   description: Gestión del Kardex e Inventario
 */

/**
 * @swagger
 * /movimientos:
 *   get:
 *     summary: Obtener historial de movimientos (Kardex)
 *     tags: [Movimientos]
 *     parameters:
 *       - in: query
 *         name: id_almacen
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: tipo_movimiento
 *         schema:
 *           type: string
 *       - in: query
 *         name: fecha_inicio
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fecha_fin
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Historial obtenido
 */
router.get('/', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), MovimientosController.index);

/**
 * @swagger
 * /movimientos/trashed:
 *   get:
 *     summary: Obtener movimientos eliminados
 *     tags: [Movimientos]
 *     responses:
 *       200:
 *         description: Papelera obtenida
 */
router.get('/trashed', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), MovimientosController.trashed);

/**
 * @swagger
 * /movimientos/{id}:
 *   get:
 *     summary: Ver detalle de movimiento
 *     tags: [Movimientos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detalle obtenido
 */
router.get('/:id', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), MovimientosController.getById);

/**
 * @swagger
 * /movimientos:
 *   post:
 *     summary: Crear movimiento manual (Ajuste, Entrada, Salida)
 *     tags: [Movimientos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMovimiento'
 *     responses:
 *       201:
 *         description: Movimiento creado y stock actualizado
 */
router.post('/', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), validateRequest(createMovimientoSchema), MovimientosController.store);

/**
 * @swagger
 * /movimientos/transferir:
 *   post:
 *     summary: Realizar transferencia entre almacenes
 *     tags: [Movimientos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransferenciaStock'
 *     responses:
 *       200:
 *         description: Transferencia exitosa
 */
router.post('/transferir', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), validateRequest(transferenciaSchema), MovimientosController.transferir);

/**
 * @swagger
 * /movimientos/{id}:
 *   put:
 *     summary: Actualizar movimiento (Sólo notas)
 *     tags: [Movimientos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notas:
 *                 type: string
 *     responses:
 *       200:
 *         description: Movimiento actualizado
 */
router.put('/:id', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), MovimientosController.update);

/**
 * @swagger
 * /movimientos/{id}:
 *   delete:
 *     summary: Eliminar movimiento (Soft Delete - No revierte stock)
 *     tags: [Movimientos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Movimiento eliminado
 */
router.delete('/:id', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), MovimientosController.destroy);

/**
 * @swagger
 * /movimientos/{id}/restore:
 *   put:
 *     summary: Restaurar movimiento eliminado
 *     tags: [Movimientos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Movimiento restaurado
 */
router.put('/:id/restore', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), MovimientosController.restore);

/**
 * @swagger
 * /movimientos/{id}/force:
 *   delete:
 *     summary: Eliminar movimiento definitivamente
 *     tags: [Movimientos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Movimiento eliminado permanentemente
 */
router.delete('/:id/force', checkAuthAny(['SuperAdmin', 'Administrador', 'Vendedor']), MovimientosController.forceDestroy);

module.exports = router;
