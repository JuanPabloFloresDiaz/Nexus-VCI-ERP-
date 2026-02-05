const { z } = require('zod');

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateCategoria:
 *       type: object
 *       required:
 *         - nombre_categoria
 *       properties:
 *         nombre_categoria:
 *           type: string
 *           description: Name of the category.
 *         descripcion_categoria:
 *           type: string
 *           description: Description of the category.
 *         subcategorias:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               nombre_subcategoria:
 *                 type: string
 *     CreateSubcategoria:
 *       type: object
 *       required:
 *         - nombre_subcategoria
 *         - id_categoria
 *       properties:
 *         nombre_subcategoria:
 *           type: string
 *         id_categoria:
 *           type: string
 *           format: uuid
 */

const createCategoriaSchema = z.object({
    body: z.object({
        nombre_categoria: z
            .string({ required_error: 'El nombre de la categoría es requerido' })
            .min(1, 'El nombre no puede estar vacío')
            .max(100, 'El nombre no puede exceder 100 caracteres'),
        descripcion_categoria: z
            .string()
            .optional()
            .nullable(),
        // Optional nested subcategories creation
        subcategorias: z.array(
            z.object({
                nombre_subcategoria: z.string().min(1).max(100)
            })
        ).optional()
    })
});

const updateCategoriaSchema = z.object({
    body: z.object({
        nombre_categoria: z
            .string()
            .min(1)
            .max(100)
            .optional(),
        descripcion_categoria: z
            .string()
            .optional()
            .nullable()
    })
});

const bulkCategoriaSchema = z.object({
    body: z.array(
        z.object({
            nombre_categoria: z.string().min(1).max(100),
            descripcion_categoria: z.string().optional().nullable(),
            subcategorias: z.array(
                z.object({
                    nombre_subcategoria: z.string().min(1).max(100),
                    filtros: z.array(
                        z.object({
                            nombre_filtro: z.string().min(1).max(100),
                            tipo_dato: z.enum(['Texto', 'Numérico', 'Lista']).default('Texto'),
                            opciones: z.array(
                                z.object({
                                    valor_opcion: z.string().min(1).max(100)
                                })
                            ).optional()
                        })
                    ).optional()
                })
            ).optional()
        })
    ).min(1, 'Debe enviar al menos una categoría')
});

const createSubcategoriaSchema = z.object({
    body: z.object({
        id_categoria: z.string().uuid('ID de categoría inválido'),
        nombre_subcategoria: z.string().min(1).max(100),
        descripcion_subcategoria: z.string().optional().nullable()
    })
});

const updateSubcategoriaSchema = z.object({
    body: z.object({
        id_categoria: z.string().uuid().optional(),
        nombre_subcategoria: z.string().min(1).max(100).optional(),
        descripcion_subcategoria: z.string().optional().nullable()
    })
});

const bulkSubcategoriaSchema = z.object({
    body: z.array(
        z.object({
            id_categoria: z.string().uuid(),
            nombre_subcategoria: z.string().min(1).max(100),
            descripcion_subcategoria: z.string().optional().nullable()
        })
    ).min(1, 'Debe enviar al menos una subcategoría')
});

module.exports = {
    createCategoriaSchema,
    updateCategoriaSchema,
    bulkCategoriaSchema,
    createSubcategoriaSchema,
    updateSubcategoriaSchema,
    bulkSubcategoriaSchema
};
