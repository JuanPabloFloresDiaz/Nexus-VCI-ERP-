const { z } = require('zod');

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateProducto:
 *       type: object
 *       required:
 *         - id_subcategoria
 *         - id_usuario_gestor
 *         - nombre_producto
 *         - descripcion_producto
 *         - precio_unitario
 *       properties:
 *         id_subcategoria:
 *           type: string
 *           format: uuid
 *         id_usuario_gestor:
 *           type: string
 *           format: uuid
 *         nombre_producto:
 *           type: string
 *         descripcion_producto:
 *           type: string
 *         precio_unitario:
 *           type: number
 *         stock_actual:
 *           type: integer
 *         imagen_url:
 *           type: string
 *         detalles:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id_opcion_filtro:
 *                 type: string
 *                 format: uuid
 *         id_empresa:
 *           type: string
 *           format: uuid
 *     UpdateStock:
 *       type: object
 *       required:
 *         - cantidad
 *       properties:
 *         cantidad:
 *           type: integer
 *           description: Cantidad a sumar (positivo) o restar (negativo).
 */

const createProductoSchema = z.object({
    body: z.object({
        id_subcategoria: z.string().uuid('ID de subcategoría inválido'),
        id_usuario_gestor: z.string().uuid('ID de usuario gestor inválido'),
        nombre_producto: z.string().min(1, 'El nombre es requerido').max(150),
        descripcion_producto: z.string().min(1, 'La descripción es requerida'),
        precio_unitario: z.number({ invalid_type_error: 'El precio debe ser un número' }).positive('El precio debe ser positivo'),
        costo_unitario: z.number({ invalid_type_error: 'El costo debe ser un número' }).positive('El costo debe ser positivo').default(0),
        stock_actual: z.number().int().nonnegative().default(0),
        stock_minimo: z.number().int().nonnegative().default(5),
        imagen_url: z.string().url().optional().nullable(),
        detalles: z.array(
            z.object({
                id_opcion_filtro: z.string().uuid('ID de opción inválido')
            })
        ).optional(),
        id_empresa: z.string().uuid().optional()
    })
});

const updateProductoSchema = z.object({
    body: z.object({
        id_subcategoria: z.string().uuid().optional(),
        nombre_producto: z.string().min(1).max(150).optional(),
        descripcion_producto: z.string().min(1).optional(),
        precio_unitario: z.number().positive().optional(),
        costo_unitario: z.number().positive().optional(),
        stock_actual: z.number().int().nonnegative().optional(),
        stock_minimo: z.number().int().nonnegative().optional(),
        imagen_url: z.string().url().optional().nullable(),
        estado_producto: z.boolean().optional(),
        id_empresa: z.string().uuid().optional()
    })
});

const bulkProductoSchema = z.object({
    body: z.array(
        z.object({
            id_subcategoria: z.string().uuid(),
            id_usuario_gestor: z.string().uuid(),
            nombre_producto: z.string().min(1).max(150),
            descripcion_producto: z.string().min(1),
            precio_unitario: z.number().positive(),
            costo_unitario: z.number().positive().default(0),
            stock_actual: z.number().int().nonnegative().default(0),
            stock_minimo: z.number().int().nonnegative().default(5),
            imagen_url: z.string().url().optional().nullable(),
            detalles: z.array(z.object({ id_opcion_filtro: z.string().uuid() })).optional(),
            id_empresa: z.string().uuid().optional()
        })
    ).min(1, 'Debe enviar al menos un producto')
});

const updateStockSchema = z.object({
    body: z.object({
        cantidad: z.number().int({ message: 'La cantidad debe ser un entero' })
    })
});

const createDetalleSchema = z.object({
    body: z.object({
        id_producto: z.string().uuid('ID de producto inválido'),
        id_opcion_filtro: z.string().uuid('ID de opción inválido')
    })
});

const bulkDetalleSchema = z.object({
    body: z.object({
        id_producto: z.string().uuid(),
        detalles: z.array(z.string().uuid()).min(1)
    })
});

module.exports = {
    createProductoSchema,
    updateProductoSchema,
    bulkProductoSchema,
    updateStockSchema,
    createDetalleSchema,
    bulkDetalleSchema
};
