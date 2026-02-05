const { z } = require('zod');

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateProveedor:
 *       type: object
 *       required:
 *         - nombre_proveedor
 *       properties:
 *         nombre_proveedor:
 *           type: string
 *           description: Name of the provider.
 *         contacto_nombre:
 *           type: string
 *           description: Name of the contact person.
 *         telefono_proveedor:
 *           type: string
 *           description: Phone number.
 *         correo_proveedor:
 *           type: string
 *           description: Email address.
 *     UpdateProveedor:
 *       type: object
 *       properties:
 *         nombre_proveedor:
 *           type: string
 *         contacto_nombre:
 *           type: string
 *         telefono_proveedor:
 *           type: string
 *         correo_proveedor:
 *           type: string
 */

const createProveedorSchema = z.object({
    body: z.object({
        nombre_proveedor: z.string().min(1, 'El nombre del proveedor es requerido').max(150),
        contacto_nombre: z.string().max(100).optional().nullable(),
        telefono_proveedor: z.string().max(15).optional().nullable(),
        correo_proveedor: z.string().email('Debe ser un correo válido').max(100).optional().nullable()
    })
});

const updateProveedorSchema = z.object({
    body: z.object({
        nombre_proveedor: z.string().min(1).max(150).optional(),
        contacto_nombre: z.string().max(100).optional().nullable(),
        telefono_proveedor: z.string().max(15).optional().nullable(),
        correo_proveedor: z.string().email().max(100).optional().nullable()
    })
});

const bulkProveedorSchema = z.object({
    body: z.array(
        z.object({
            nombre_proveedor: z.string().min(1, 'El nombre del proveedor es requerido').max(150),
            contacto_nombre: z.string().max(100).optional().nullable(),
            telefono_proveedor: z.string().max(15).optional().nullable(),
            correo_proveedor: z.string().email('Debe ser un correo válido').max(100).optional().nullable()
        })
    ).min(1, 'Debe enviar al menos un proveedor')
});

module.exports = {
    createProveedorSchema,
    updateProveedorSchema,
    bulkProveedorSchema
};
