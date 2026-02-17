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
 *               - id_variante
 *               - cantidad
 *               - precio_costo_historico
 *             properties:
 *               id_variante:
 *                 type: string
 *                 format: uuid
 *               cantidad:
 *                 type: number
 *               precio_costo_historico:
 *                 type: number
 *         id_empresa:
 *           type: string
 *           format: uuid
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
                id_variante: z.string().uuid('ID de variante inválido'),
                cantidad: z.number().int().positive('La cantidad debe ser positiva'),
                precio_historico: z.number().positive('El precio debe ser positivo'),
                detalles_producto: z.record(z.any()).optional()
            })
        ).min(1, 'El pedido debe tener al menos un detalle'),
        id_empresa: z.string().uuid().optional(),
        // Add optional ALMACEN_ORIGEN override in body? Controller allows it.
        id_almacen_origen: z.string().uuid().optional()
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
            // Allow resolving by ID or by Object
            id_cliente: z.string().uuid().optional(),
            cliente: z.object({
                nombre_cliente: z.string().min(1, 'Nombre requerido'),
                apellido_cliente: z.string().min(1, 'Apellido requerido'),
                dui_cliente: z.string().optional(), // DUI is optional but recommended for uniqueness
                correo_cliente: z.string().email('Correo inválido'),
                telefono_cliente: z.string().optional(),
                direccion_cliente: z.string().optional() // Although model doesn't have it, we might receive it and ignore or store in future. But user said NO ADDRESS. Let's keep it optional or remove. User said "no hay dirección". I'll remove it from strict validation or just leave optional and ignore.
            }).optional(),

            // Order Metadata
            fecha_pedido: z.string().optional(), // YYYY-MM-DD or ISO
            estado_pedido: z.enum(['Pendiente', 'Completado', 'Cancelado']).optional(),

            // User creator is inferred from token, but we can allow override if needed? No, plan says "Use req.user.id".

            detalles: z.array(
                z.object({
                    sku: z.string().min(1, 'SKU requerido'), // We use SKU to resolve variant
                    cantidad: z.number().int().positive(),
                    precio_historico: z.number().positive(),
                    detalles_producto: z.record(z.any()).optional()
                })
            ).min(1),
            id_empresa: z.string().uuid().optional()
        })
    ).min(1, 'Debe enviar al menos un pedido')
});

module.exports = {
    createPedidoSchema,
    updateEstadoSchema,
    bulkPedidoSchema
};
