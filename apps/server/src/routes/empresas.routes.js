const express = require('express');
const EmpresasController = require('../controllers/empresas.controller');
// const { verifyToken, isAdmin } = require('../middlewares/auth'); // Uncomment when middlewares are ready

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Empresas
 *   description: API for managing companies
 */

/**
 * @swagger
 * /empresas:
 *   get:
 *     summary: Get all companies (Admin)
 *     tags: [Empresas]
 *     responses:
 *       200:
 *         description: List of companies
 *   post:
 *     summary: Create a new company
 *     tags: [Empresas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEmpresa'
 *     responses:
 *       201:
 *         description: Company created
 */

/**
 * @swagger
 * /empresas/{id}:
 *   get:
 *     summary: Get company by ID
 *     tags: [Empresas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Company details
 *       404:
 *         description: Company not found
 *   put:
 *     summary: Update a company
 *     tags: [Empresas]
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
 *             $ref: '#/components/schemas/UpdateEmpresa'
 *     responses:
 *       200:
 *         description: Company updated
 *   delete:
 *     summary: Soft delete a company
 *     tags: [Empresas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Company deleted
 */

// Define routes
router.get('/', EmpresasController.index);
router.get('/:id', EmpresasController.getById);
router.post('/', EmpresasController.store); // Protect later?
router.put('/:id', EmpresasController.update);
router.delete('/:id', EmpresasController.destroy);

module.exports = router;
