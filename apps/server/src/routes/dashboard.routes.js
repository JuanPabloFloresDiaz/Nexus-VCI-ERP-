const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboard.controller');
const { checkAuthAny } = require('../middlewares/checkAuth');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Métricas y estadísticas del sistema
 */

// Apply auth middleware to all dashboard routes
router.use(checkAuthAny());

/**
 * @swagger
 * /dashboard/metrics:
 *   get:
 *     summary: Obtener métricas generales (Ventas totales, Total Productos)
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Métricas obtenidas correctamente
 * */
router.get('/metrics', DashboardController.getMetrics);

/**
 * @swagger
 * /dashboard/top-products:
 *   get:
 *     summary: Ranking de 5 productos más vendidos (por cantidad)
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Ranking obtenido correctamente
 * */
router.get('/top-products', DashboardController.getTopProductos);

/**
 * @swagger
 * /dashboard/top-clients:
 *   get:
 *     summary: Top 5 clientes con más pedidos
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Top clientes obtenido correctamente
 * */
router.get('/top-clients', DashboardController.getTopClientes);

module.exports = router;
