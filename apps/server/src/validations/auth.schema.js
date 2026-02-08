
const { z } = require('zod');

/**
 * @swagger
 * components:
 *   schemas:
 *     Login:
 *       type: object
 *       required:
 *         - correo_electronico
 *         - clave_acceso
 *       properties:
 *         correo_electronico:
 *           type: string
 *           description: The user's email address.
 *           example: "ale@gmail.com"
 *         clave_acceso:
 *           type: string
 *           description: The user's password.
 *           example: "Clave123!"
 *     Register:
 *       type: object
 *       required:
 *         - nombre_empresa
 *         - nombre_usuario
 *         - correo_electronico
 *         - clave_acceso
 *       properties:
 *         nombre_empresa:
 *           type: string
 *           description: Name of the company to register.
 *           example: "Tech Solutions Ltd."
 *         nombre_usuario:
 *           type: string
 *           description: Name of the initial admin user.
 *           example: "Admin User"
 *         correo_electronico:
 *           type: string
 *           description: Email address for the admin user.
 *           example: "admin@techsolutions.com"
 *         clave_acceso:
 *           type: string
 *           description: Password for the admin user.
 *           example: "SecurePass123!"
 */

const loginSchema = z.object({
    body: z.object({
        correo_electronico: z
            .string({ required_error: 'Email is required' })
            .regex(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+$/, 'Email must be valid')
            .max(250, 'Email must not exceed 250 characters'),
        clave_acceso: z
            .string({ required_error: 'Password is required' })
            .min(8, 'Password must be at least 8 characters')
            .max(250, 'Password must not exceed 250 characters'),
    }),
});

const registerSchema = z.object({
    body: z.object({
        nombre_empresa: z
            .string({ required_error: 'El nombre de la empresa es requerido' })
            .min(1, 'El nombre de la empresa no puede estar vacío')
            .max(150, 'El nombre de la empresa no puede exceder los 150 caracteres'),
        nombre_usuario: z
            .string({ required_error: 'El nombre de usuario es requerido' })
            .min(1, 'El nombre de usuario no puede estar vacío')
            .max(100, 'El nombre de usuario no puede exceder los 100 caracteres'),
        correo_electronico: z
            .string({ required_error: 'El correo electrónico es requerido' })
            .regex(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+$/, 'Debe ser un correo válido')
            .max(100, 'El correo no puede exceder los 100 caracteres'),
        clave_acceso: z
            .string({ required_error: 'La contraseña es requerida' })
            .min(8, 'La contraseña debe tener al menos 8 caracteres')
            .max(255, 'La contraseña no puede exceder los 255 caracteres'),
        nit_empresa: z.string().nullable().optional(),
        telefono_empresa: z.string().nullable().optional(),
        direccion_empresa: z.string().nullable().optional(),
        correo_empresa: z.string().regex(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+$/, 'Debe ser un correo válido').nullable().optional().or(z.literal('')),
        logo_url: z.string().nullable().optional(),
    }),
});

module.exports = {
    loginSchema,
    registerSchema
};
