const { z } = require('zod');

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateEmpresa:
 *       type: object
 *       required:
 *         - nombre_empresa
 *       properties:
 *         nombre_empresa:
 *           type: string
 *           description: Name of the company.
 *           example: "Tech Solutions"
 *         nit_empresa:
 *           type: string
 *           description: Tax ID.
 *           example: "1234-567890-123-1"
 *         telefono_empresa:
 *           type: string
 *           description: Company phone.
 *           example: "2222-3333"
 *         correo_empresa:
 *           type: string
 *           description: Company email.
 *           example: "contact@techsolutions.com"
 *         direccion_empresa:
 *           type: string
 *           description: Physical address.
 *           example: "123 Main St, City"
 *         logo_url:
 *           type: string
 *           description: URL of the company logo.
 *           example: "https://example.com/logo.png"
 *     UpdateEmpresa:
 *       type: object
 *       properties:
 *         nombre_empresa:
 *           type: string
 *         nit_empresa:
 *           type: string
 *         telefono_empresa:
 *           type: string
 *         correo_empresa:
 *           type: string
 *         direccion_empresa:
 *           type: string
 *         logo_url:
 *           type: string
 */

const createEmpresaSchema = z.object({
    body: z.object({
        nombre_empresa: z
            .string({ required_error: 'El nombre de la empresa es requerido' })
            .min(1, 'El nombre no puede estar vacío')
            .max(150, 'El nombre no puede exceder los 150 caracteres'),
        nit_empresa: z
            .string()
            .max(20, 'El NIT no puede exceder los 20 caracteres')
            .optional()
            .nullable(),
        telefono_empresa: z
            .string()
            .max(15, 'El teléfono no puede exceder los 15 caracteres')
            .optional()
            .nullable(),
        correo_empresa: z
            .string()
            .email('Debe ser un correo válido')
            .max(100, 'El correo no puede exceder los 100 caracteres')
            .optional()
            .nullable(),
        direccion_empresa: z
            .string()
            .optional()
            .nullable(),
        logo_url: z
            .string()
            .url('Debe ser una URL válida')
            .max(255)
            .optional()
            .nullable()
    })
});

const updateEmpresaSchema = z.object({
    body: z.object({
        nombre_empresa: z.string().min(1).max(150).optional(),
        nit_empresa: z.string().max(20).optional().nullable(),
        telefono_empresa: z.string().max(15).optional().nullable(),
        correo_empresa: z.string().email().max(100).optional().nullable(),
        direccion_empresa: z.string().optional().nullable(),
        logo_url: z.string().url().max(255).optional().nullable()
    })
});

module.exports = {
    createEmpresaSchema,
    updateEmpresaSchema
};
