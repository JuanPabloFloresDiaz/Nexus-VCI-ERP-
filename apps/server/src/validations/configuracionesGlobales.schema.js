const { z } = require('zod');

/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateConfiguracionGlobal:
 *       type: object
 *       required:
 *         - id_divisa_base
 *       properties:
 *         id_divisa_base:
 *           type: string
 *           format: uuid
 *           description: El ID (UUID) de la divisa seleccionada como base
 */

const updateConfiguracionGlobalSchema = z.object({
    body: z.object({
        id_divisa_base: z.string({
            required_error: "El ID de la divisa base es obligatorio",
            invalid_type_error: "El ID de la divisa base debe ser texto"
        }).uuid('El ID de la divisa base debe ser un UUID válido')
    })
});

module.exports = {
    updateConfiguracionGlobalSchema
};
