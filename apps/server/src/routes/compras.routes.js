const router = require('express').Router();
const ComprasController = require('../controllers/compras.controller');
const validateRequest = require('../utils/validateRequest');
const { createCompraSchema, updateCompraSchema, bulkCompraSchema } = require('../validations/compras.schema');
const { verifyToken } = require('../auth');

/**
 * @swagger
 * tags:
 *   name: Compras
 *   description: API for managing purchases
 */

/**
 * @swagger
 * /compras:
 *   get:
 *     summary: Get all purchases
 *     tags: [Compras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         description: Search by total amount
 *         schema:
 *           type: string
 *       - in: query
 *         name: id_proveedor
 *         schema:
 *           type: string
 *       - in: query
 *         name: estado_compra
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of purchases
 *   post:
 *     summary: Create a new purchase
 *     tags: [Compras]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCompra'
 *     responses:
 *       201:
 *         description: Purchase created
 */

/**
 * @swagger
 * /compras/trashed:
 *   get:
 *     summary: Get soft-deleted purchases
 *     tags: [Compras]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of trashed purchases
 */

/**
 * @swagger
 * /compras/{id}:
 *   get:
 *     summary: Get purchase by ID
 *     tags: [Compras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Purchase details
 *       404:
 *         description: Purchase not found
 *   put:
 *     summary: Update a purchase status
 *     tags: [Compras]
 *     security:
 *       - bearerAuth: []
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
 *             $ref: '#/components/schemas/UpdateCompra'
 *     responses:
 *       200:
 *         description: Purchase status updated
 *   delete:
 *     summary: Soft delete a purchase
 *     tags: [Compras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Purchase deleted
 */

/**
 * @swagger
 * /compras/{id}/restore:
 *   put:
 *     summary: Restore a soft-deleted purchase
 *     tags: [Compras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Purchase restored
 */

/**
 * @swagger
 * /compras/{id}/force:
 *   delete:
 *     summary: Permanently delete a purchase
 *     tags: [Compras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Purchase permanently deleted
 */

/**
 * @swagger
 * /compras/bulk:
 *   post:
 *     summary: Create multiple purchases
 *     tags: [Compras]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/CreateCompra'
 *     responses:
 *       201:
 *         description: Purchases created
 */

// Apply auth middleware
router.use(verifyToken);

router.get('/', ComprasController.index);
router.get('/trashed', ComprasController.trashed);
router.get('/:id', ComprasController.getById);

router.post('/', validateRequest(createCompraSchema), ComprasController.store);
router.post('/bulk', validateRequest(bulkCompraSchema), ComprasController.bulkStore);

router.put('/:id', validateRequest(updateCompraSchema), ComprasController.update);
router.put('/:id/restore', ComprasController.restore);

router.delete('/:id', ComprasController.destroy);
router.delete('/:id/force', ComprasController.forceDestroy);

module.exports = router;
