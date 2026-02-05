
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
 */

const loginSchema = z.object({
    body: z.object({
        correo_electronico: z
            .string({ required_error: 'Email is required' })
            .email('Email must be valid')
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
            .email('Debe ser un correo válido')
            .max(100, 'El correo no puede exceder los 100 caracteres'),
        clave_acceso: z
            .string({ required_error: 'La contraseña es requerida' })
            .min(8, 'La contraseña debe tener al menos 8 caracteres')
            .max(255, 'La contraseña no puede exceder los 255 caracteres'),
    }),
});

module.exports = {
    loginSchema,
    registerSchema
};
