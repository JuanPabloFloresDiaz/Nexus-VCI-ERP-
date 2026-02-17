const { z } = require('zod');

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateMovimiento:
 *       type: object
 *       required:
 *         - id_variante
 *         - id_almacen
 *         - tipo_movimiento
 *         - cantidad
 *       properties:
 *         id_variante:
 *           type: string
 *           format: uuid
 *         id_almacen:
 *           type: string
 *           format: uuid
 *         tipo_movimiento:
 *           type: string
 *           enum: [Entrada, Salida, Transferencia, Ajuste, Venta, Compra]
 *         cantidad:
 *           type: number
 *         costo_unitario:
 *           type: number
 *         notas:
 *           type: string
 *     TransferenciaStock:
 *       type: object
 *       required:
 *         - id_variante
 *         - id_almacen_origen
 *         - id_almacen_destino
 *         - cantidad
 *       properties:
 *         id_variante:
 *           type: string
 *           format: uuid
 *         id_almacen_origen:
 *           type: string
 *           format: uuid
 *         id_almacen_destino:
 *           type: string
 *           format: uuid
 *         cantidad:
 *           type: integer
 *           description: Cantidad a transferir (positivo).
 *         notas:
 *           type: string
 */

const createMovimientoSchema = z.object({
    body: z.object({
        id_variante: z.string().uuid('ID de variante inválido'),
        id_almacen: z.string().uuid('ID de almacén inválido'),
        tipo_movimiento: z.enum(['Entrada', 'Salida', 'Transferencia', 'Ajuste', 'Venta', 'Compra']),
        cantidad: z.number().int().nonnegative('La cantidad debe ser positiva? Depende de la lógica, pero inputs suelen ser positivos'),
        // Nota: En la base de datos se puede guardar negativo si es salida, pero el input de usuario 'cantidad' suele ser absoluto
        // El controlador decide el signo basado en el tipo.
        costo_unitario: z.number().optional(),
        id_empresa: z.string().uuid().optional()
    })
});

const transferenciaSchema = z.object({
    body: z.object({
        id_almacen_origen: z.string().uuid('ID de almacén origen inválido'),
        id_almacen_destino: z.string().uuid('ID de almacén destino inválido'),
        items: z.array(z.object({
            id_variante: z.string().uuid('ID de variante inválido'),
            sku: z.string().optional(),
            cantidad: z.number().int().positive('La cantidad a transferir debe ser mayor a 0')
        })).nonempty('Debe incluir al menos un producto para transferir')
    })
});

module.exports = {
    createMovimientoSchema,
    transferenciaSchema
};
