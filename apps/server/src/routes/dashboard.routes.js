const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboard.controller');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Métricas y estadísticas del sistema
 */

/**
 * @swagger
 * /dashboard/metrics:
 *   get:
 *     summary: Obtener métricas generales (Ventas totales, Total Productos)
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Métricas obtenidas correctamente
 */
router.get('/metrics', DashboardController.getMetrics);

/**
 * @swagger
 * /dashboard/top-productos:
 *   get:
 *     summary: Ranking de 5 productos más vendidos (por cantidad)
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Ranking obtenido correctamente
 */
router.get('/top-productos', DashboardController.getTopProductos);

/**
 * @swagger
 * /dashboard/top-clientes:
 *   get:
 *     summary: Top 5 clientes con más pedidos
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Top clientes obtenido correctamente
 */
router.get('/top-clientes', DashboardController.getTopClientes);

module.exports = router;
