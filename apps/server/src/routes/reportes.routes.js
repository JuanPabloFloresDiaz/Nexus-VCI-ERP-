const express = require('express');
const router = express.Router();
const ReportesController = require('../controllers/reportes.controller');

/**
 * @swagger
 * tags:
 *   name: Reportes
 *   description: Generación de reportes en PDF y Excel
 */

// ==========================================
// PDF REPORTS
// ==========================================

/**
 * @swagger
 * /reportes/categorizacion:
 *   get:
 *     summary: Reporte PDF completo de categorías
 *     tags: [Reportes]
 *     responses:
 *       200:
 *         description: Archivo PDF descargable
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/categorizacion', ReportesController.getCategorizacionReport);

/**
 * @swagger
 * /reportes/productos:
 *   get:
 *     summary: Reporte PDF de productos (filtro opcional por categoría)
 *     tags: [Reportes]
 *     parameters:
 *       - in: query
 *         name: id_categoria
 *         schema:
 *           type: string
 *         description: ID de la categoría para filtrar
 *     responses:
 *       200:
 *         description: Archivo PDF descargable
 */
router.get('/productos', ReportesController.getProductosReport);

/**
 * @swagger
 * /reportes/clientes:
 *   get:
 *     summary: Reporte PDF de listado de clientes
 *     tags: [Reportes]
 *     responses:
 *       200:
 *         description: Archivo PDF descargable
 */
router.get('/clientes', ReportesController.getClientesReport);

/**
 * @swagger
 * /reportes/pedidos-log:
 *   get:
 *     summary: Bitácora PDF de pedidos (filtro por fecha)
 *     tags: [Reportes]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Archivo PDF descargable
 */
router.get('/pedidos-log', ReportesController.getPedidosLogReport);

/**
 * @swagger
 * /reportes/factura/{id}:
 *   get:
 *     summary: Generar factura PDF de un pedido
 *     tags: [Reportes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Archivo PDF descargable
 */
router.get('/factura/:id', ReportesController.getFacturaPedido);

// ==========================================
// EXCEL REPORTS
// ==========================================

/**
 * @swagger
 * /reportes/pedidos-excel:
 *   get:
 *     summary: Exportar pedidos a Excel (filtro por fecha)
 *     tags: [Reportes]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Archivo Excel descargable
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/pedidos-excel', ReportesController.getPedidosExcelReport);

module.exports = router;
