const { z } = require('zod');

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateCliente:
 *       type: object
 *       required:
 *         - nombre_cliente
 *         - apellido_cliente
 *         - correo_cliente
 *       properties:
 *         nombre_cliente:
 *           type: string
 *           description: First name of the client.
 *           example: "Maria"
 *         apellido_cliente:
 *           type: string
 *           description: Last name of the client.
 *           example: "Gonzalez"
 *         dui_cliente:
 *           type: string
 *           description: Unique identity document (DUI).
 *           example: "12345678-9"
 *         telefono_cliente:
 *           type: string
 *           description: Phone number.
 *           example: "7000-0000"
 *         correo_cliente:
 *           type: string
 *           description: Email address.
 *           example: "maria@example.com"
 *     UpdateCliente:
 *       type: object
 *       properties:
 *         nombre_cliente:
 *           type: string
 *         apellido_cliente:
 *           type: string
 *         dui_cliente:
 *           type: string
 *         telefono_cliente:
 *           type: string
 *         correo_cliente:
 *           type: string
 */

const createClienteSchema = z.object({
    body: z.object({
        nombre_cliente: z
            .string({ required_error: 'El nombre es requerido' })
            .min(1, 'El nombre no puede estar vacío')
            .max(100, 'El nombre no puede exceder los 100 caracteres'),
        apellido_cliente: z
            .string({ required_error: 'El apellido es requerido' })
            .min(1, 'El apellido no puede estar vacío')
            .max(100, 'El apellido no puede exceder los 100 caracteres'),
        dui_cliente: z
            .string()
            .max(10, 'El DUI no puede exceder los 10 caracteres')
            .optional()
            .nullable(),
        telefono_cliente: z
            .string()
            .max(15, 'El teléfono no puede exceder los 15 caracteres')
            .optional()
            .nullable(),
        correo_cliente: z
            .string({ required_error: 'El correo es requerido' })
            .email('Debe ser un correo válido')
            .max(100, 'El correo no puede exceder los 100 caracteres'),
    }),
});

const updateClienteSchema = z.object({
    body: z.object({
        nombre_cliente: z
            .string()
            .min(1, 'El nombre no puede estar vacío')
            .max(100)
            .optional(),
        apellido_cliente: z
            .string()
            .min(1, 'El apellido no puede estar vacío')
            .max(100)
            .optional(),
        dui_cliente: z
            .string()
            .max(10)
            .optional()
            .nullable(),
        telefono_cliente: z
            .string()
            .max(15)
            .optional()
            .nullable(),
        correo_cliente: z
            .string()
            .email('Debe ser un correo válido')
            .max(100)
            .optional(),
    }),
});

const bulkClienteSchema = z.object({
    body: z.array(
        z.object({
            nombre_cliente: z.string().min(1).max(100),
            apellido_cliente: z.string().min(1).max(100),
            dui_cliente: z.string().max(10).optional().nullable(),
            telefono_cliente: z.string().max(15).optional().nullable(),
            correo_cliente: z.string().email().max(100)
        })
    ).min(1, 'Debe enviar al menos un cliente')
});

module.exports = { createClienteSchema, updateClienteSchema, bulkClienteSchema };
