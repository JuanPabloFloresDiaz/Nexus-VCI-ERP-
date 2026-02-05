const { z } = require('zod');

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateFiltro:
 *       type: object
 *       required:
 *         - id_subcategoria
 *         - nombre_filtro
 *       properties:
 *         id_subcategoria:
 *           type: string
 *           format: uuid
 *         nombre_filtro:
 *           type: string
 *         tipo_dato:
 *           type: string
 *           enum: [Texto, Numérico, Lista]
 *     CreateOpcionFiltro:
 *       type: object
 *       required:
 *         - id_filtro
 *         - valor_opcion
 *       properties:
 *         id_filtro:
 *           type: string
 *           format: uuid
 *         valor_opcion:
 *           type: string
 */

const createFiltroSchema = z.object({
    body: z.object({
        id_subcategoria: z.string().uuid('ID de subcategoría inválido'),
        nombre_filtro: z.string().min(1, 'El nombre del filtro es requerido').max(100),
        tipo_dato: z.enum(['Texto', 'Numérico', 'Lista']).default('Texto').optional()
    })
});

const updateFiltroSchema = z.object({
    body: z.object({
        id_subcategoria: z.string().uuid().optional(),
        nombre_filtro: z.string().min(1).max(100).optional(),
        tipo_dato: z.enum(['Texto', 'Numérico', 'Lista']).optional()
    })
});

const createOpcionSchema = z.object({
    body: z.object({
        id_filtro: z.string().uuid('ID de filtro inválido'),
        valor_opcion: z.string().min(1, 'El valor de la opción es requerido').max(100)
    })
});

const updateOpcionSchema = z.object({
    body: z.object({
        id_filtro: z.string().uuid().optional(),
        valor_opcion: z.string().min(1).max(100).optional()
    })
});

const bulkOpcionSchema = z.object({
    body: z.object({
        id_filtro: z.string().uuid('ID de filtro inválido'),
        opciones: z.array(z.string().min(1).max(100)).min(1, 'Debe enviar al menos una opción')
    })
});

module.exports = {
    createFiltroSchema,
    updateFiltroSchema,
    createOpcionSchema,
    updateOpcionSchema,
    bulkOpcionSchema
};
