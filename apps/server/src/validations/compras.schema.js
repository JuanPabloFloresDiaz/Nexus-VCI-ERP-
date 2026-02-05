const { z } = require('zod');

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateCompra:
 *       type: object
 *       properties:
 *         id_proveedor:
 *           type: string
 *           format: uuid
 *           description: ID of existing provider. Condition - either this or nuevo_proveedor required.
 *         nuevo_proveedor:
 *           type: object
 *           properties:
 *             nombre_proveedor:
 *               type: string
 *             contacto_nombre:
 *               type: string
 *             telefono_proveedor:
 *               type: string
 *             correo_proveedor:
 *               type: string
 *         fecha_entrega_estimada:
 *           type: string
 *           format: date
 *         estado_compra:
 *           type: string
 *           enum: [Pendiente, Recibido, Cancelado]
 *           default: Recibido
 *         detalles:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - id_producto
 *               - cantidad
 *               - precio_costo_historico
 *             properties:
 *               id_producto:
 *                 type: string
 *                 format: uuid
 *               cantidad:
 *                 type: number
 *               precio_costo_historico:
 *                 type: number
 *     UpdateCompra:
 *       type: object
 *       properties:
 *         estado_compra:
 *           type: string
 *           enum: [Pendiente, Recibido, Cancelado]
 *         fecha_entrega_estimada:
 *           type: string
 *           format: date
 */

// Schema for creating a provider inline within a purchase
const inlineProveedorSchema = z.object({
    nombre_proveedor: z.string().min(1).max(150),
    contacto_nombre: z.string().max(100).optional().nullable(),
    telefono_proveedor: z.string().max(15).optional().nullable(),
    correo_proveedor: z.string().email().max(100).optional().nullable()
});

const detalleCompraSchema = z.object({
    id_producto: z.string().uuid('ID de producto inválido'),
    cantidad: z.number().int().positive('La cantidad debe ser mayor a 0'),
    precio_costo_historico: z.number().positive('El costo debe ser positivo')
});

const createCompraSchema = z.object({
    body: z.object({
        // Either id_proveedor OR nuevo_proveedor must be provided.
        // We make both optional here and valid logic is handled in controller or via refinement if strictly needed schema-side.
        // For simplicity allow both optional but logic enforces one.
        id_proveedor: z.string().uuid().optional().nullable(),
        nuevo_proveedor: inlineProveedorSchema.optional().nullable(),
        fecha_entrega_estimada: z.string().datetime({ offset: true }).optional().nullable().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD')), // Allow ISO or DateOnly string
        estado_compra: z.enum(['Pendiente', 'Recibido', 'Cancelado']).default('Recibido'), // Purchases usually entered as received for stock update, but allow option
        detalles: z.array(detalleCompraSchema).min(1, 'La compra debe tener al menos un detalle')
    }).refine(data => data.id_proveedor || data.nuevo_proveedor, {
        message: "Debe proporcionar un 'id_proveedor' existente o un 'nuevo_proveedor'",
        path: ["id_proveedor"] // Error pointer
    })
});

const updateCompraSchema = z.object({
    body: z.object({
        estado_compra: z.enum(['Pendiente', 'Recibido', 'Cancelado']).optional(),
        fecha_entrega_estimada: z.string().optional().nullable()
    })
});

const bulkCompraSchema = z.object({
    body: z.array(
        z.object({
            id_proveedor: z.string().uuid().optional().nullable(),
            nuevo_proveedor: inlineProveedorSchema.optional().nullable(),
            fecha_entrega_estimada: z.string().optional().nullable(),
            estado_compra: z.enum(['Pendiente', 'Recibido', 'Cancelado']).default('Recibido'),
            detalles: z.array(detalleCompraSchema).min(1)
        }).refine(data => data.id_proveedor || data.nuevo_proveedor, {
            message: "Debe proporcionar un 'id_proveedor' existente o un 'nuevo_proveedor'",
            path: ["id_proveedor"]
        })
    ).min(1, 'Debe enviar al menos una compra')
});

module.exports = {
    createCompraSchema,
    updateCompraSchema,
    bulkCompraSchema
};
