const { z } = require('zod');

/**
 * @swagger
 * components:
 *   schemas:
 *     CreatePedido:
 *       type: object
 *       required:
 *         - id_cliente
 *         - id_usuario_creador
 *         - detalles
 *       properties:
 *         id_cliente:
 *           type: string
 *           format: uuid
 *         id_usuario_creador:
 *           type: string
 *           format: uuid
 *         detalles:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - id_producto
 *               - cantidad
 *               - precio_historico
 *             properties:
 *               id_producto:
 *                 type: string
 *                 format: uuid
 *               cantidad:
 *                 type: integer
 *               precio_historico:
 *                 type: number
 *     UpdateEstadoPedido:
 *       type: object
 *       required:
 *         - estado_pedido
 *       properties:
 *         estado_pedido:
 *           type: string
 *           enum: [Pendiente, Completado, Cancelado]
 */

const createPedidoSchema = z.object({
    body: z.object({
        id_cliente: z.string().uuid('ID de cliente inválido'),
        id_usuario_creador: z.string().uuid('ID de usuario creador inválido'),
        detalles: z.array(
            z.object({
                id_producto: z.string().uuid('ID de producto inválido'),
                cantidad: z.number().int().positive('La cantidad debe ser positiva'),
                precio_historico: z.number().positive('El precio debe ser positivo')
            })
        ).min(1, 'El pedido debe tener al menos un detalle')
    })
});

const updateEstadoSchema = z.object({
    body: z.object({
        estado_pedido: z.enum(['Pendiente', 'Completado', 'Cancelado'], {
            errorMap: () => ({ message: 'Estado inválido. Valores permitidos: Pendiente, Completado, Cancelado' })
        })
    })
});

const bulkPedidoSchema = z.object({
    body: z.array(
        z.object({
            id_cliente: z.string().uuid(),
            id_usuario_creador: z.string().uuid(),
            detalles: z.array(
                z.object({
                    id_producto: z.string().uuid(),
                    cantidad: z.number().int().positive(),
                    precio_historico: z.number().positive()
                })
            ).min(1)
        })
    ).min(1, 'Debe enviar al menos un pedido')
});

module.exports = {
    createPedidoSchema,
    updateEstadoSchema,
    bulkPedidoSchema
};
