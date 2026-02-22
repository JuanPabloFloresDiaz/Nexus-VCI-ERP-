const { z } = require('zod');

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateTasaCambio:
 *       type: object
 *       required:
 *         - codigo_iso_origen
 *         - codigo_iso_destino
 *         - tasa_cambio
 *       properties:
 *         codigo_iso_origen:
 *           type: string
 *           description: Código ISO de la moneda de origen.
 *           example: "USD"
 *         codigo_iso_destino:
 *           type: string
 *           description: Código ISO de la moneda destino.
 *           example: "GTQ"
 *         tasa_cambio:
 *           type: number
 *           description: Valor de conversión.
 *           example: 7.80
 *     UpdateTasaCambio:
 *       type: object
 *       properties:
 *         codigo_iso_origen:
 *           type: string
 *         codigo_iso_destino:
 *           type: string
 *         tasa_cambio:
 *           type: number
 *         estado:
 *           type: boolean
 */

const createTasaCambioSchema = z.object({
    body: z.object({
        codigo_iso_origen: z.string({
            required_error: "El código ISO de origen es obligatorio",
            invalid_type_error: "El código ISO de origen debe ser texto"
        }).length(3, 'El código ISO de origen debe tener exactamente 3 caracteres'),

        codigo_iso_destino: z.string({
            required_error: "El código ISO de destino es obligatorio",
            invalid_type_error: "El código ISO de destino debe ser texto"
        }).length(3, 'El código ISO de destino debe tener exactamente 3 caracteres'),

        tasa_cambio: z.number({
            required_error: "La tasa de cambio es obligatoria",
            invalid_type_error: "La tasa de cambio debe ser un número"
        }).positive('La tasa de cambio debe ser positiva')
    })
});

const updateTasaCambioSchema = z.object({
    body: z.object({
        codigo_iso_origen: z.string().length(3).optional(),
        codigo_iso_destino: z.string().length(3).optional(),
        tasa_cambio: z.number().positive().optional(),
        estado: z.boolean().optional()
    })
});

module.exports = {
    createTasaCambioSchema,
    updateTasaCambioSchema
};
