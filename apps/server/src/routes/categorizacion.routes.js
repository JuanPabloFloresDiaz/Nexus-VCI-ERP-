const express = require('express');
const router = express.Router();

const CategoriasController = require('../controllers/categorias.controller');
const SubcategoriasController = require('../controllers/subcategorias.controller');
const validateRequest = require('../utils/validateRequest');
const {
    createCategoriaSchema,
    updateCategoriaSchema,
    bulkCategoriaSchema,
    createSubcategoriaSchema,
    updateSubcategoriaSchema,
    bulkSubcategoriaSchema
} = require('../validations/categorizacion.schema');
const { checkAuthAny } = require('../middlewares/checkAuth');

/**
 * @swagger
 * tags:
 *   - name: Categorias
 *     description: Gestión de categorías
 *   - name: Subcategorias
 *     description: Gestión de subcategorías
 */

// Apply auth middleware to all routes
router.use(checkAuthAny());

// ==========================================
// RUTAS DE CATEGORIAS
// ==========================================

/**
 * @swagger
 * /categorias:
 *   get:
 *     summary: Listado paginado de categorías
 *     tags: [Categorias]
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
router.get('/categorias', CategoriasController.index);

/**
 * @swagger
 * /categorias/trashed:
 *   get:
 *     summary: Obtener categorías en papelera
 *     tags: [Categorias]
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
router.get('/categorias/trashed', CategoriasController.trashed);

/**
 * @swagger
 * /categorias/all:
 *   get:
 *     summary: Listado rápido de categorías
 *     tags: [Categorias]
 */
router.get('/categorias/all', CategoriasController.all);

/**
 * @swagger
 * /categorias:
 *   post:
 *     summary: Crear categoría (individual o anidada)
 *     tags: [Categorias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoria'
 *     responses:
 *       201:
 *         description: Categoría creada exitosamente
 */
router.post('/categorias', validateRequest(createCategoriaSchema), CategoriasController.store);

/**
 * @swagger
 * /categorias/bulk:
 *   post:
 *     summary: Creación masiva de categorías
 *     tags: [Categorias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/CreateCategoria'
 *     responses:
 *       201:
 *         description: Categorías creadas exitosamente
 */
router.post('/categorias/bulk', validateRequest(bulkCategoriaSchema), CategoriasController.bulkStore);

/**
 * @swagger
 * /categorias/{id}:
 *   get:
 *     summary: Obtener categoría por ID
 *     tags: [Categorias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categoría obtenida correctamente
 *       404:
 *         description: Categoría no encontrada
 */
router.get('/categorias/:id', CategoriasController.getById);

/**
 * @swagger
 * /categorias/{id}:
 *   put:
 *     summary: Actualizar categoría
 *     tags: [Categorias]
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
 *             $ref: '#/components/schemas/CreateCategoria'
 *     responses:
 *       200:
 *         description: Categoría actualizada exitosamente
 */
router.put('/categorias/:id', validateRequest(updateCategoriaSchema), CategoriasController.update);

/**
 * @swagger
 * /categorias/{id}:
 *   delete:
 *     summary: Eliminar (Soft) categoría
 *     tags: [Categorias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categoría eliminada correctamente
 */
router.delete('/categorias/:id', CategoriasController.destroy);

router.put('/categorias/:id/restore', CategoriasController.restore);
router.delete('/categorias/:id/force', CategoriasController.forceDestroy);

// ==========================================
// RUTAS DE SUBCATEGORIAS
// ==========================================

/**
 * @swagger
 * /subcategorias:
 *   get:
 *     summary: Listado paginado de subcategorías
 *     tags: [Subcategorias]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre
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
router.get('/subcategorias', SubcategoriasController.index);

/**
 * @swagger
 * /subcategorias/trashed:
 *   get:
 *     summary: Obtener subcategorías en papelera
 *     tags: [Subcategorias]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *     responses:
 *       200:
 *         description: Listado de papelera obtenido correctamente
 */
router.get('/subcategorias/trashed', SubcategoriasController.trashed);

/**
 * @swagger
 * /subcategorias/by-categoria/{id}:
 *   get:
 *     summary: Obtener subcategorías por ID de categoría
 *     tags: [Subcategorias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subcategorías obtenidas correctamente
 */
router.get('/subcategorias/by-categoria/:id', SubcategoriasController.getByCategoria);

/**
 * @swagger
 * /subcategorias:
 *   post:
 *     summary: Crear subcategoría
 *     tags: [Subcategorias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSubcategoria'
 *     responses:
 *       201:
 *         description: Subcategoría creada exitosamente
 */
router.post('/subcategorias', validateRequest(createSubcategoriaSchema), SubcategoriasController.store);

/**
 * @swagger
 * /subcategorias/bulk:
 *   post:
 *     summary: Creación masiva de subcategorías
 *     tags: [Subcategorias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/CreateSubcategoria'
 *     responses:
 *       201:
 *         description: Subcategorías creadas exitosamente
 */
router.post('/subcategorias/bulk', validateRequest(bulkSubcategoriaSchema), SubcategoriasController.bulkStore);

/**
 * @swagger
 * /subcategorias/{id}:
 *   put:
 *     summary: Actualizar subcategoría
 *     tags: [Subcategorias]
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
 *             $ref: '#/components/schemas/CreateSubcategoria'
 *     responses:
 *       200:
 *         description: Subcategoría actualizada exitosamente
 */
router.put('/subcategorias/:id', validateRequest(updateSubcategoriaSchema), SubcategoriasController.update);

/**
 * @swagger
 * /subcategorias/{id}:
 *   delete:
 *     summary: Eliminar (Soft) subcategoría
 *     tags: [Subcategorias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subcategoría eliminada correctamente
 */
router.delete('/subcategorias/:id', SubcategoriasController.destroy);

router.put('/subcategorias/:id/restore', SubcategoriasController.restore);
router.delete('/subcategorias/:id/force', SubcategoriasController.forceDestroy);

module.exports = router;
