const express = require('express');
const router = express.Router();
const ChartsController = require('../controllers/charts.controller');
const { checkAuthAny } = require('../middlewares/checkAuth');

// All routes require authentication
router.use(checkAuthAny());

/**
 * @swagger
 * /api/charts/stats:
 *   get:
 *     summary: Obtener estadísticas del dashboard
 *     tags: [Gráficas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Estadísticas generales obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_sales:
 *                       type: number
 *                     total_orders:
 *                       type: integer
 *                     total_customers:
 *                       type: integer
 */
router.get('/stats', ChartsController.getDashboardStats);

/**
 * @swagger
 * /api/charts/sales-history:
 *   get:
 *     summary: Obtener historial de ventas
 *     tags: [Gráficas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Historial de ventas obtenido exitosamente
 */
router.get('/sales-history', ChartsController.getSalesHistory);

/**
 * @swagger
 * /api/charts/top-products:
 *   get:
 *     summary: Obtener productos más vendidos
 *     tags: [Gráficas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Top productos obtenidos exitosamente
 */
router.get('/top-products', ChartsController.getTopProducts);

/**
 * @swagger
 * /api/charts/order-status:
 *   get:
 *     summary: Obtener distribución de estado de pedidos
 *     tags: [Gráficas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio (YYYY-MM-DD) (Opcional)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin (YYYY-MM-DD) (Opcional)
 *     responses:
 *       200:
 *         description: Distribución de estados obtenida exitosamente
 */
router.get('/order-status', ChartsController.getOrderStatus);

/**
 * @swagger
 * /api/charts/top-categories:
 *   get:
 *     summary: Obtener categorías más vendidas
 *     tags: [Gráficas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Top categorías obtenidas exitosamente
 */
router.get('/top-categories', ChartsController.getTopCategories);

module.exports = router;
