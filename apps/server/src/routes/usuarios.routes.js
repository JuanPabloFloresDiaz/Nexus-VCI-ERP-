const express = require('express');
const router = express.Router();
const { index, trashed, all, store, update, destroy, restore, forceDestroy } = require('../controllers/usuarios.controller');
const validateRequest = require('../utils/validateRequest');
const { createUserSchema, updateUserSchema } = require('../validations/usuarios.schema');

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: API para la gestión de usuarios
 */

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Obtener listado paginado de usuarios (con búsqueda opcional)
 *     tags: [Usuarios]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre o correo
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
router.get('/', index);

/**
 * @swagger
 * /usuarios/trashed:
 *   get:
 *     summary: Obtener usuarios en papelera (soft deleted)
 *     tags: [Usuarios]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre o correo
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *     responses:
 *       200:
 *         description: Listado de papelera obtenido correctamente
 */
router.get('/trashed', trashed);

/**
 * @swagger
 * /usuarios/all:
 *   get:
 *     summary: Obtener listado rápido de usuarios (id, nombre)
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Listado rápido obtenido
 */
router.get('/all', all);

/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: Crear un nuevo usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUser'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 */
router.post('/', validateRequest(createUserSchema), store);

/**
 * @swagger
 * /usuarios/{id}:
 *   put:
 *     summary: Actualizar un usuario existente
 *     tags: [Usuarios]
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
 *             $ref: '#/components/schemas/UpdateUser'
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 */
router.put('/:id', validateRequest(updateUserSchema), update);

/**
 * @swagger
 * /usuarios/{id}:
 *   delete:
 *     summary: Eliminar (soft delete) un usuario
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario eliminado (soft delete)
 */
router.delete('/:id', destroy);

/**
 * @swagger
 * /usuarios/{id}/restore:
 *   put:
 *     summary: Restaurar un usuario eliminado (soft deleted)
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario restaurado correctamente
 */
router.put('/:id/restore', restore);

/**
 * @swagger
 * /usuarios/{id}/force:
 *   delete:
 *     summary: Eliminar definitivamente un usuario (Hard Delete)
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario eliminado definitivamente
 */
router.delete('/:id/force', forceDestroy);

module.exports = router;
