const { z } = require('zod');

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateUser:
 *       type: object
 *       required:
 *         - nombre_usuario
 *         - correo_electronico
 *         - clave_acceso
 *         - rol_usuario
 *       properties:
 *         nombre_usuario:
 *           type: string
 *           description: Full name of the user.
 *           example: "Juan Perez"
 *         correo_electronico:
 *           type: string
 *           description: Email address.
 *           example: "juan@example.com"
 *         clave_acceso:
 *           type: string
 *           description: Password (min 8 chars).
 *           example: "Secret123!"
 *         rol_usuario:
 *           type: string
 *           enum: [Administrador, Vendedor]
 *           description: Role of the user.
 *           example: "Vendedor"
 *     UpdateUser:
 *       type: object
 *       properties:
 *         nombre_usuario:
 *           type: string
 *         correo_electronico:
 *           type: string
 *         rol_usuario:
 *           type: string
 *         estado_usuario:
 *           type: boolean
 */

const createUserSchema = z.object({
    body: z.object({
        nombre_usuario: z
            .string({ required_error: 'El nombre es requerido' })
            .min(1, 'El nombre no puede estar vacío')
            .max(100, 'El nombre no puede exceder los 100 caracteres'),
        correo_electronico: z
            .string({ required_error: 'El correo es requerido' })
            .email('Debe ser un correo válido')
            .max(100, 'El correo no puede exceder los 100 caracteres'),
        clave_acceso: z
            .string({ required_error: 'La contraseña es requerida' })
            .min(8, 'La contraseña debe tener al menos 8 caracteres')
            .max(255, 'La contraseña no puede exceder los 255 caracteres'),
        rol_usuario: z
            .enum(['Administrador', 'Vendedor'], {
                required_error: 'El rol es requerido',
                invalid_type_error: 'El rol debe ser Administrador o Vendedor'
            })
    }),
});

const updateUserSchema = z.object({
    body: z.object({
        nombre_usuario: z
            .string()
            .min(1, 'El nombre no puede estar vacío')
            .max(100)
            .optional(),
        correo_electronico: z
            .string()
            .email('Debe ser un correo válido')
            .max(100)
            .optional(),
        // Password update is handled separately or not allowed via this endpoint usually, 
        // but per plan "Actualización de perfil y rol", we stick to profile fields. 
        // If password needs update, usually it's a separate endpoint, but I will exclude it here to follow best practices unless explicitly asked.
        rol_usuario: z
            .enum(['Administrador', 'Vendedor'])
            .optional(),
        estado_usuario: z
            .boolean()
            .optional()
    }),
});

module.exports = { createUserSchema, updateUserSchema };
