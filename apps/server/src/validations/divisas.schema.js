const { z } = require('zod');

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateDivisa:
 *       type: object
 *       required:
 *         - nombre_divisa
 *         - codigo_iso
 *         - simbolo
 *       properties:
 *         nombre_divisa:
 *           type: string
 *           description: Nombre oficial de la moneda.
 *           example: "Dólar Estadounidense"
 *         codigo_iso:
 *           type: string
 *           description: Código ISO 4217 de 3 letras.
 *           example: "USD"
 *         simbolo:
 *           type: string
 *           description: Símbolo de la moneda.
 *           example: "$"
 *     UpdateDivisa:
 *       type: object
 *       properties:
 *         nombre_divisa:
 *           type: string
 *         codigo_iso:
 *           type: string
 *         simbolo:
 *           type: string
 *         estado:
 *           type: boolean
 */

const createDivisaSchema = z.object({
    body: z.object({
        nombre_divisa: z.string({
            required_error: "El nombre de la divisa es obligatorio",
            invalid_type_error: "El nombre de la divisa debe ser texto"
        }).min(1, 'El nombre de la divisa no puede estar vacío').max(50, 'El nombre de la divisa no puede exceder los 50 caracteres'),

        codigo_iso: z.string({
            required_error: "El código ISO es obligatorio",
            invalid_type_error: "El código ISO debe ser texto"
        }).length(3, 'El código ISO debe tener exactamente 3 caracteres'),

        simbolo: z.string({
            required_error: "El símbolo es obligatorio",
            invalid_type_error: "El símbolo debe ser texto"
        }).min(1, 'El símbolo no puede estar vacío').max(5, 'El símbolo no puede exceder los 5 caracteres')
    })
});

const updateDivisaSchema = z.object({
    body: z.object({
        nombre_divisa: z.string().min(1).max(50).optional(),
        codigo_iso: z.string().length(3).optional(),
        simbolo: z.string().min(1).max(5).optional(),
        estado: z.boolean().optional()
    })
});

module.exports = {
    createDivisaSchema,
    updateDivisaSchema
};
