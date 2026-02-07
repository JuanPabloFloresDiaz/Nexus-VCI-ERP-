const express = require('express');
const EmpresasController = require('../controllers/empresas.controller');
const { checkAuth, checkAuthAny } = require('../middlewares/checkAuth');

const validateRequest = require('../utils/validateRequest');
const { createEmpresaSchema, updateEmpresaSchema } = require('../validations/empresas.schema');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Empresas
 *   description: API for managing companies
 */

// Route to get the profile of the logged-in user's company (Admin/SuperAdmin)
router.get('/profile', checkAuthAny(), EmpresasController.getProfile);
router.put('/profile', checkAuthAny(), validateRequest(updateEmpresaSchema), EmpresasController.updateProfile);

// Routes below this line require SuperAdministrador role
router.get('/select', checkAuth('SuperAdministrador'), EmpresasController.listSelect);
router.get('/trashed', checkAuth('SuperAdministrador'), EmpresasController.trashed);
router.patch('/:id/restore', checkAuth('SuperAdministrador'), EmpresasController.restore);
router.delete('/:id/force', checkAuth('SuperAdministrador'), EmpresasController.destroyPermanent);

/**
 * @swagger
 * /empresas:
 *   get:
 *     summary: Get all companies (SuperAdmin)
 *     tags: [Empresas]
 *     responses:
 *       200:
 *         description: List of companies
 *   post:
 *     summary: Create a new company
 *     tags: [Empresas]
 *     responses:
 *       201:
 *         description: Company created
 */
router.get('/', checkAuth('SuperAdministrador'), EmpresasController.index);
router.post('/', checkAuth('SuperAdministrador'), validateRequest(createEmpresaSchema), EmpresasController.store);

/**
 * @swagger
 * /empresas/{id}:
 *   get:
 *     summary: Get company by ID
 *     tags: [Empresas]
 *     responses:
 *       200:
 *         description: Company details
 *   put:
 *     summary: Update a company
 *     tags: [Empresas]
 *     responses:
 *       200:
 *         description: Company updated
 *   delete:
 *     summary: Soft delete a company
 *     tags: [Empresas]
 *     responses:
 *       200:
 *         description: Company deleted
 */
router.get('/:id', checkAuth('SuperAdministrador'), EmpresasController.getById);
router.put('/:id', checkAuth('SuperAdministrador'), validateRequest(updateEmpresaSchema), EmpresasController.update);
router.delete('/:id', checkAuth('SuperAdministrador'), EmpresasController.destroy);

module.exports = router;
