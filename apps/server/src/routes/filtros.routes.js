const express = require('express');
const router = express.Router();

const FiltrosController = require('../controllers/filtros.controller');
const OpcionesFiltroController = require('../controllers/opcionesFiltro.controller');
const validateRequest = require('../utils/validateRequest');
const {
    createFiltroSchema,
    updateFiltroSchema,
    createOpcionSchema,
    updateOpcionSchema,
    bulkOpcionSchema
} = require('../validations/filtros.schema');

/**
 * @swagger
 * tags:
 *   - name: Filtros
 *     description: Gestión de filtros dinámicos
 *   - name: OpcionesFiltro
 *     description: Gestión de opciones de filtros
 */

// ==========================================
// RUTAS DE FILTROS
// ==========================================

/**
 * @swagger
 * /filtros:
 *   get:
 *     summary: Listado paginado de filtros
 *     tags: [Filtros]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre o tipo
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
router.get('/filtros', FiltrosController.index);

/**
 * @swagger
 * /filtros/trashed:
 *   get:
 *     summary: Obtener filtros en papelera (soft deleted)
 *     tags: [Filtros]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre o tipo
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *     responses:
 *       200:
 *         description: Listado de papelera obtenido correctamente
 */
router.get('/filtros/trashed', FiltrosController.trashed);

/**
 * @swagger
 * /filtros/by-subcategoria/{id}:
 *   get:
 *     summary: Obtener filtros y opciones por ID de subcategoría
 *     tags: [Filtros]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Filtros obtenidos correctamente
 */
router.get('/filtros/by-subcategoria/:id', FiltrosController.getBySubcategoria);

/**
 * @swagger
 * /filtros:
 *   post:
 *     summary: Crear filtro
 *     tags: [Filtros]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFiltro'
 *     responses:
 *       201:
 *         description: Filtro creado exitosamente
 */
router.post('/filtros', validateRequest(createFiltroSchema), FiltrosController.store);

/**
 * @swagger
 * /filtros/{id}:
 *   put:
 *     summary: Actualizar filtro
 *     tags: [Filtros]
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
 *             $ref: '#/components/schemas/CreateFiltro'
 *     responses:
 *       200:
 *         description: Filtro actualizado exitosamente
 */
router.put('/filtros/:id', validateRequest(updateFiltroSchema), FiltrosController.update);

/**
 * @swagger
 * /filtros/{id}:
 *   delete:
 *     summary: Eliminar (Soft) filtro
 *     tags: [Filtros]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Filtro eliminado correctamente
 */
router.delete('/filtros/:id', FiltrosController.destroy);

router.put('/filtros/:id/restore', FiltrosController.restore);
router.delete('/filtros/:id/force', FiltrosController.forceDestroy);

// ==========================================
// RUTAS DE OPCIONES DE FILTRO
// ==========================================

/**
 * @swagger
 * /opciones-filtro:
 *   get:
 *     summary: Listado paginado de opciones
 *     tags: [OpcionesFiltro]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por valor
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
router.get('/opciones-filtro', OpcionesFiltroController.index);

/**
 * @swagger
 * /opciones-filtro/trashed:
 *   get:
 *     summary: Obtener opciones en papelera (soft deleted)
 *     tags: [OpcionesFiltro]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por valor
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *     responses:
 *       200:
 *         description: Listado de papelera obtenido correctamente
 */
router.get('/opciones-filtro/trashed', OpcionesFiltroController.trashed);

/**
 * @swagger
 * /opciones-filtro:
 *   post:
 *     summary: Crear opción de filtro
 *     tags: [OpcionesFiltro]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOpcionFiltro'
 *     responses:
 *       201:
 *         description: Opción creada exitosamente
 */
router.post('/opciones-filtro', validateRequest(createOpcionSchema), OpcionesFiltroController.store);

/**
 * @swagger
 * /opciones-filtro/bulk-options:
 *   post:
 *     summary: Creación masiva de opciones para un filtro
 *     tags: [OpcionesFiltro]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_filtro:
 *                 type: string
 *                 format: uuid
 *               opciones:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Opciones creadas exitosamente
 */
router.post('/opciones-filtro/bulk-options', validateRequest(bulkOpcionSchema), OpcionesFiltroController.bulkStore);

/**
 * @swagger
 * /opciones-filtro/{id}:
 *   put:
 *     summary: Actualizar opción de filtro
 *     tags: [OpcionesFiltro]
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
 *             $ref: '#/components/schemas/CreateOpcionFiltro'
 *     responses:
 *       200:
 *         description: Opción actualizada exitosamente
 */
router.put('/opciones-filtro/:id', validateRequest(updateOpcionSchema), OpcionesFiltroController.update);

/**
 * @swagger
 * /opciones-filtro/{id}:
 *   delete:
 *     summary: Eliminar (Soft) opción de filtro
 *     tags: [OpcionesFiltro]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Opción eliminada correctamente
 */
router.delete('/opciones-filtro/:id', OpcionesFiltroController.destroy);

router.put('/opciones-filtro/:id/restore', OpcionesFiltroController.restore);
router.delete('/opciones-filtro/:id/force', OpcionesFiltroController.forceDestroy);

module.exports = router;
