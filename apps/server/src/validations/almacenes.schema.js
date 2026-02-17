const { z } = require('zod');

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateAlmacen:
 *       type: object
 *       required:
 *         - nombre_almacen
 *       properties:
 *         nombre_almacen:
 *           type: string
 *           description: Nombre del almacén.
 *         ubicacion:
 *           type: string
 *           description: Dirección o ubicación física.
 *         responsable:
 *           type: string
 *           description: Nombre del responsable del almacén.
 *         telefono:
 *           type: string
 *         es_principal:
 *           type: boolean
 *           description: Define si es el almacén principal.
 *     UpdateAlmacen:
 *       type: object
 *       properties:
 *         nombre_almacen:
 *           type: string
 *         ubicacion:
 *           type: string
 *         responsable:
 *           type: string
 *         telefono:
 *           type: string
 *         es_principal:
 *           type: boolean
 *         estado:
 *           type: boolean
 */

const createAlmacenSchema = z.object({
    body: z.object({
        nombre_almacen: z.string().min(1, 'El nombre del almacén es requerido').max(100),
        ubicacion: z.string().optional(),
        es_principal: z.boolean().optional().default(false),
        id_empresa: z.string().uuid().optional()
    })
});

const updateAlmacenSchema = z.object({
    body: z.object({
        nombre_almacen: z.string().min(1).max(100).optional(),
        ubicacion: z.string().optional(),
        responsable: z.string().optional(),
        telefono: z.string().optional(),
        es_principal: z.boolean().optional(),
        estado: z.boolean().optional(),
        id_empresa: z.string().uuid().optional()
    })
});

module.exports = {
    createAlmacenSchema,
    updateAlmacenSchema
};
