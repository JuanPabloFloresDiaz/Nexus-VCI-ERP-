const { Categorias, Subcategorias, Filtros, OpcionesFiltro, sequelize } = require('../models');
const { Op } = require('sequelize');
const catchErrors = require('../utils/tryCatch');
const ApiResponse = require('../utils/apiResponse');
const getPaginatedQuery = require('../utils/getPaginatedQuery');

class CategoriasController {
    static routes = '/categorias';

    static index = catchErrors(async (req, res) => {
        const { query, limit, offset, order } = getPaginatedQuery(req.query);
        const { search } = req.query;
        const { id_empresa } = req.user;

        const where = { ...query, id_empresa };

        if (search) {
            where[Op.or] = [
                { nombre_categoria: { [Op.like]: `%${search}%` } },
                { descripcion_categoria: { [Op.like]: `%${search}%` } }
            ];
        }

        const data = await Categorias.findAndCountAll({
            where,
            limit,
            offset,
            order,
            include: [{
                model: Subcategorias,
                as: 'subcategorias',
                attributes: ['id', 'nombre_subcategoria']
            }]
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Listado de categorías obtenido correctamente',
            status: 200,
            route: this.routes
        });
    });

    static trashed = catchErrors(async (req, res) => {
        const { query, limit, offset, order } = getPaginatedQuery(req.query);
        const { search } = req.query;
        const { id_empresa } = req.user;

        const where = {
            ...query,
            id_empresa,
            deleted_at: { [Op.not]: null }
        };

        if (search) {
            where[Op.or] = [
                { nombre_categoria: { [Op.like]: `%${search}%` } },
                { descripcion_categoria: { [Op.like]: `%${search}%` } }
            ];
        }

        const data = await Categorias.findAndCountAll({
            where,
            limit,
            offset,
            order,
            paranoid: false,
            include: [{
                model: Subcategorias,
                as: 'subcategorias',
                attributes: ['id', 'nombre_subcategoria'],
                paranoid: false // Include even if subcategories are also soft-deleted (optional choice)
            }]
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Papelera de categorías obtenida correctamente',
            status: 200,
            route: `${this.routes}/trashed`
        });
    });

    static all = catchErrors(async (req, res) => {
        const { id_empresa } = req.user;
        const data = await Categorias.findAll({
            where: { id_empresa },
            attributes: ['id', 'nombre_categoria'],
            order: [['nombre_categoria', 'ASC']]
        });

        return ApiResponse.success(res, {
            data,
            message: 'Listado rápido de categorías obtenido correctamente',
            status: 200,
            route: `${this.routes}/all`
        });
    });

    static store = catchErrors(async (req, res) => {
        const { nombre_categoria, descripcion_categoria, subcategorias } = req.body;

        // Transaction since we might create subcategories
        const result = await sequelize.transaction(async (t) => {
            // Check for duplicate name
            const existing = await Categorias.findOne({
                where: { nombre_categoria, id_empresa: req.user.id_empresa },
                transaction: t
            });
            if (existing) {
                throw new Error('La categoría ya existe');
            }

            const newCategoria = await Categorias.create({
                id_empresa: req.user.id_empresa,
                nombre_categoria,
                descripcion_categoria
            }, { transaction: t });

            if (subcategorias && subcategorias.length > 0) {
                const subCats = subcategorias.map(sub => ({
                    ...sub,
                    id_categoria: newCategoria.id
                }));
                await Subcategorias.bulkCreate(subCats, { transaction: t });
            }

            return newCategoria;
        });

        const data = await Categorias.findByPk(result.id, {
            include: [{ model: Subcategorias, as: 'subcategorias' }]
        });

        return ApiResponse.success(res, {
            data,
            message: 'Categoría creada exitosamente',
            status: 201,
            route: this.routes
        });
    });

    static bulkStore = catchErrors(async (req, res) => {
        const items = req.body.map(item => ({ ...item, id_empresa: req.user.id_empresa })); // Inject id_empresa

        // We use bulkCreate with deep includes to handle nested creation automatically
        const data = await Categorias.bulkCreate(items, {
            include: [{
                model: Subcategorias,
                as: 'subcategorias',
                include: [{
                    model: Filtros,
                    as: 'filtros',
                    include: [{
                        model: OpcionesFiltro,
                        as: 'opciones'
                    }]
                }]
            }],
            validate: true // Run validations
        });

        return ApiResponse.success(res, {
            data,
            message: `${data.length} categorías creadas exitosamente`,
            status: 201,
            route: `${this.routes}/bulk`
        });
    });

    static update = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;
        const { nombre_categoria, descripcion_categoria } = req.body;

        const categoria = await Categorias.findOne({ where: { id, id_empresa } });
        if (!categoria) {
            return ApiResponse.error(res, {
                error: 'Categoría no encontrada',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        if (nombre_categoria && nombre_categoria !== categoria.nombre_categoria) {
            const existing = await Categorias.findOne({
                where: {
                    nombre_categoria,
                    id_empresa,
                    id: { [Op.ne]: id }
                }
            });
            if (existing) {
                return ApiResponse.error(res, {
                    error: 'El nombre de categoría ya existe',
                    status: 400,
                    route: `${this.routes}/${id}`
                });
            }
        }

        await categoria.update({
            nombre_categoria,
            descripcion_categoria
        });

        return ApiResponse.success(res, {
            data: categoria,
            message: 'Categoría actualizada exitosamente',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static destroy = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;
        const categoria = await Categorias.findOne({ where: { id, id_empresa } });

        if (!categoria) {
            return ApiResponse.error(res, {
                error: 'Categoría no encontrada',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        await categoria.destroy(); // Soft delete

        return ApiResponse.success(res, {
            data: null,
            message: 'Categoría eliminada correctamente (Soft Delete)',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static restore = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;
        const categoria = await Categorias.findOne({
            where: { id, id_empresa },
            paranoid: false
        });

        if (!categoria) {
            return ApiResponse.error(res, {
                error: 'Categoría no encontrada',
                status: 404,
                route: `${this.routes}/${id}/restore`
            });
        }

        if (!categoria.deleted_at) {
            return ApiResponse.error(res, {
                error: 'La categoría no está eliminada',
                status: 400,
                route: `${this.routes}/${id}/restore`
            });
        }

        await categoria.restore();

        return ApiResponse.success(res, {
            data: categoria,
            message: 'Categoría restaurada correctamente',
            status: 200,
            route: `${this.routes}/${id}/restore`
        });
    });

    static forceDestroy = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;
        const categoria = await Categorias.findOne({
            where: { id, id_empresa },
            paranoid: false
        });

        if (!categoria) {
            return ApiResponse.error(res, {
                error: 'Categoría no encontrada',
                status: 404,
                route: `${this.routes}/${id}/force`
            });
        }

        await categoria.destroy({ force: true });

        return ApiResponse.success(res, {
            data: null,
            message: 'Categoría eliminada definitivamente',
            status: 200,
            route: `${this.routes}/${id}/force`
        });
    });
}

module.exports = CategoriasController;
