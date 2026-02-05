const router = require('express').Router();
const ProveedoresController = require('../controllers/proveedores.controller');
const validateRequest = require('../utils/validateRequest');
const { createProveedorSchema, updateProveedorSchema, bulkProveedorSchema } = require('../validations/proveedores.schema');
const { verifyToken } = require('../auth'); // Assuming auth middleware exists

/**
 * @swagger
 * tags:
 *   name: Proveedores
 *   description: API for managing suppliers
 */

/**
 * @swagger
 * /proveedores:
 *   get:
 *     summary: Get all suppliers
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, contact or email
 *     responses:
 *       200:
 *         description: List of suppliers
 *   post:
 *     summary: Create a new supplier
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProveedor'
 *     responses:
 *       201:
 *         description: Supplier created
 */

/**
 * @swagger
 * /proveedores/trashed:
 *   get:
 *     summary: Get soft-deleted suppliers
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of trashed suppliers
 */

/**
 * @swagger
 * /proveedores/{id}:
 *   get:
 *     summary: Get supplier by ID
 *     tags: [Proveedores]
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
 *         description: Supplier details
 *       404:
 *         description: Supplier not found
 *   put:
 *     summary: Update a supplier
 *     tags: [Proveedores]
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
 *             $ref: '#/components/schemas/UpdateProveedor'
 *     responses:
 *       200:
 *         description: Supplier updated
 *   delete:
 *     summary: Soft delete a supplier
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Supplier deleted
 */

/**
 * @swagger
 * /proveedores/{id}/restore:
 *   put:
 *     summary: Restore a soft-deleted supplier
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Supplier restored
 */

/**
 * @swagger
 * /proveedores/{id}/force:
 *   delete:
 *     summary: Permanently delete a supplier
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Supplier permanently deleted
 */

/**
 * @swagger
 * /proveedores/bulk:
 *   post:
 *     summary: Create multiple suppliers
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/CreateProveedor'
 *     responses:
 *       201:
 *         description: Suppliers created
 */

// Apply auth middleware to all routes
router.use(verifyToken);

router.get('/', ProveedoresController.index);
router.get('/trashed', ProveedoresController.trashed);
router.get('/:id', ProveedoresController.getById);

router.post('/', validateRequest(createProveedorSchema), ProveedoresController.store);
router.post('/bulk', validateRequest(bulkProveedorSchema), ProveedoresController.bulkStore);

router.put('/:id', validateRequest(updateProveedorSchema), ProveedoresController.update);
router.put('/:id/restore', ProveedoresController.restore);

router.delete('/:id', ProveedoresController.destroy);
router.delete('/:id/force', ProveedoresController.forceDestroy);

module.exports = router;
