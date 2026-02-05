const express = require('express');
const router = express.Router();
const ChartsController = require('../controllers/charts.controller');

/**
 * @swagger
 * tags:
 *   name: Charts
 *   description: Endpoints para alimentar gráficas del sistema
 */

/**
 * @swagger
 * /charts/order-status:
 *   get:
 *     summary: Distribución de estados de pedidos
 *     tags: [Charts]
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
 *         description: Datos obtenidos correctamente
 */
router.get('/order-status', ChartsController.getOrderStatusDistribution);

/**
 * @swagger
 * /charts/top-categories:
 *   get:
 *     summary: Top categorías con más ventas (unidades)
 *     tags: [Charts]
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
 *         description: Datos obtenidos correctamente
 */
router.get('/top-categories', ChartsController.getTopSellingCategories);

/**
 * @swagger
 * /charts/sales-history:
 *   get:
 *     summary: Historial de ventas por fecha
 *     tags: [Charts]
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
 *         description: Datos obtenidos correctamente
 */
router.get('/sales-history', ChartsController.getSalesHistory);

/**
 * @swagger
 * /charts/orders-history:
 *   get:
 *     summary: Historial de pedidos por fecha
 *     tags: [Charts]
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
 *         description: Datos obtenidos correctamente
 */
router.get('/orders-history', ChartsController.getOrdersHistory);

/**
 * @swagger
 * /charts/new-clients-history:
 *   get:
 *     summary: Historial de nuevos clientes por fecha
 *     tags: [Charts]
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
 *         description: Datos obtenidos correctamente
 */
router.get('/new-clients-history', ChartsController.getNewClientsHistory);

/**
 * @swagger
 * /charts/sales-by-subcategory:
 *   get:
 *     summary: Ventas por subcategoría (dado un id de categoría padre)
 *     tags: [Charts]
 *     parameters:
 *       - in: query
 *         name: id_categoria
 *         required: true
 *         schema:
 *           type: string
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
 *         description: Datos obtenidos correctamente
 */
router.get('/sales-by-subcategory', ChartsController.getSalesBySubcategory);

module.exports = router;
