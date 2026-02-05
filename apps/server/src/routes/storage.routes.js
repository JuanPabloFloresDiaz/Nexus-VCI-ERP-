const express = require('express');
const router = express.Router();

const StorageController = require('../controllers/storage.controller');
const upload = require('../utils/fileUpload');
const validateRequest = require('../utils/validateRequest');
// Note: Validation logic usually for body, here we validate file presence in controller or middleware.

/**
 * @swagger
 * tags:
 *   name: Storage
 *   description: Gestión de archivos y almacenamiento
 */

/**
 * @swagger
 * /storage/upload:
 *   post:
 *     summary: Subir un archivo de imagen
 *     tags: [Storage]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Archivo subido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     filename:
 *                       type: string
 */
router.post('/storage/upload', upload.single('image'), StorageController.upload);

/**
 * @swagger
 * /storage/files/{filename}:
 *   get:
 *     summary: Obtener archivo por nombre
 *     tags: [Storage]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Archivo obtenido
 *       404:
 *         description: Archivo no encontrado
 */
router.get('/storage/files/:filename', StorageController.getFile);

/**
 * @swagger
 * /storage/files/{filename}:
 *   delete:
 *     summary: Eliminar archivo (Admin/System)
 *     tags: [Storage]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Archivo eliminado
 */
router.delete('/storage/files/:filename', StorageController.delete);

module.exports = router;
