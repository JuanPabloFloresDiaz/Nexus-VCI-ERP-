const express = require('express');
const router = express.Router();

const ProductosController = require('../controllers/productos.controller');
const ProductoDetallesController = require('../controllers/productoDetalles.controller');
const validateRequest = require('../utils/validateRequest');
const {
    createProductoSchema,
    updateProductoSchema,
    bulkProductoSchema,
    updateStockSchema,
    createDetalleSchema
} = require('../validations/productos.schema');

/**
 * @swagger
 * tags:
 *   - name: Productos
 *     description: Gestión de productos e inventario
 *   - name: ProductoDetalles
 *     description: Gestión de detalles (filtros) de productos
 */

// ==========================================
// RUTAS DE PRODUCTOS
// ==========================================

/**
 * @swagger
 * /productos:
 *   get:
 *     summary: Listado paginado de productos
 *     tags: [Productos]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre o descripción
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
router.get('/productos', ProductosController.index);

/**
 * @swagger
 * /productos/trashed:
 *   get:
 *     summary: Obtener productos en papelera (soft deleted)
 *     tags: [Productos]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre o descripción
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *     responses:
 *       200:
 *         description: Listado de papelera obtenido correctamente
 */
router.get('/productos/trashed', ProductosController.trashed);

/**
 * @swagger
 * /productos/{id}:
 *   get:
 *     summary: Obtener producto por ID (con detalles completos)
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Producto obtenido correctamente
 */
router.get('/productos/:id', ProductosController.getById);

/**
 * @swagger
 * /productos:
 *   post:
 *     summary: Crear producto (individual o con detalles anidados)
 *     tags: [Productos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProducto'
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 */
router.post('/productos', validateRequest(createProductoSchema), ProductosController.store);

/**
 * @swagger
 * /productos/bulk:
 *   post:
 *     summary: Creación masiva de productos
 *     tags: [Productos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/CreateProducto'
 *     responses:
 *       201:
 *         description: Productos creados exitosamente
 */
router.post('/productos/bulk', validateRequest(bulkProductoSchema), ProductosController.bulkStore);

/**
 * @swagger
 * /productos/{id}:
 *   put:
 *     summary: Actualizar producto (datos generales)
 *     tags: [Productos]
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
 *             type: object
 *             properties:
 *               nombre_producto:
 *                 type: string
 *               precio_unitario:
 *                 type: number
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 */
router.put('/productos/:id', validateRequest(updateProductoSchema), ProductosController.update);

/**
 * @swagger
 * /productos/stock/{id}:
 *   patch:
 *     summary: Actualizar stock de producto (incrementar/decrementar)
 *     tags: [Productos]
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
 *             $ref: '#/components/schemas/UpdateStock'
 *     responses:
 *       200:
 *         description: Stock actualizado correctamente
 */
router.patch('/productos/stock/:id', validateRequest(updateStockSchema), ProductosController.updateStock);

/**
 * @swagger
 * /productos/{id}:
 *   delete:
 *     summary: Eliminar (Soft) producto
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Producto eliminado correctamente
 */
router.delete('/productos/:id', ProductosController.destroy);

router.put('/productos/:id/restore', ProductosController.restore);
router.delete('/productos/:id/force', ProductosController.forceDestroy);

// ==========================================
// RUTAS DE DETALLES (Relación Producto-Filtro)
// ==========================================

/**
 * @swagger
 * /producto-detalles:
 *   post:
 *     summary: Agregar opción de filtro a producto
 *     tags: [ProductoDetalles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_producto
 *               - id_opcion_filtro
 *             properties:
 *               id_producto:
 *                 type: string
 *                 format: uuid
 *               id_opcion_filtro:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Detalle agregado exitosamente
 */
router.post('/producto-detalles', validateRequest(createDetalleSchema), ProductoDetallesController.store);

/**
 * @swagger
 * /producto-detalles/{id}:
 *   delete:
 *     summary: Eliminar opción de filtro de producto
 *     tags: [ProductoDetalles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalle eliminado correctamente
 */
router.delete('/producto-detalles/:id', ProductoDetallesController.destroy);

module.exports = router;
