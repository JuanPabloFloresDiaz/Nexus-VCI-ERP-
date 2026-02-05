const { Subcategorias, Categorias } = require('../models');
const { Op } = require('sequelize');
const catchErrors = require('../utils/tryCatch');
const ApiResponse = require('../utils/apiResponse');
const getPaginatedQuery = require('../utils/getPaginatedQuery');

class SubcategoriasController {
    static routes = '/subcategorias';

    static index = catchErrors(async (req, res) => {
        const { query, limit, offset, order } = getPaginatedQuery(req.query);
        const { search } = req.query;
        const { id_empresa } = req.user;

        const where = { ...query, id_empresa };

        if (search) {
            where[Op.or] = [
                { nombre_subcategoria: { [Op.like]: `%${search}%` } }
            ];
        }

        const data = await Subcategorias.findAndCountAll({
            where,
            limit,
            offset,
            order,
            include: [{
                model: Categorias,
                as: 'categoria',
                attributes: ['id', 'nombre_categoria']
            }]
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Listado de subcategorías obtenido correctamente',
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
                { nombre_subcategoria: { [Op.like]: `%${search}%` } }
            ];
        }

        const data = await Subcategorias.findAndCountAll({
            where,
            limit,
            offset,
            order,
            paranoid: false,
            include: [{
                model: Categorias,
                as: 'categoria',
                attributes: ['id', 'nombre_categoria'],
                paranoid: false // Show category even if deleted
            }]
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Papelera de subcategorías obtenida correctamente',
            status: 200,
            route: `${this.routes}/trashed`
        });
    });

    static getByCategoria = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;

        // Check if category exists
        const category = await Categorias.findOne({ where: { id, id_empresa } });
        if (!category) {
            return ApiResponse.error(res, {
                error: 'Categoría no encontrada',
                status: 404,
                route: `${this.routes}/by-categoria/${id}`
            });
        }

        const subcategorias = await Subcategorias.findAll({
            where: { id_categoria: id, id_empresa },
            attributes: ['id', 'nombre_subcategoria'],
            order: [['nombre_subcategoria', 'ASC']]
        });

        return ApiResponse.success(res, {
            data: subcategorias,
            message: `Subcategorías de ${category.nombre_categoria}`,
            status: 200,
            route: `${this.routes}/by-categoria/${id}`
        });
    });

    static store = catchErrors(async (req, res) => {
        const { id_categoria, nombre_subcategoria, descripcion_subcategoria } = req.body;
        const { id_empresa } = req.user;

        const categoria = await Categorias.findOne({ where: { id: id_categoria, id_empresa } });
        if (!categoria) {
            return ApiResponse.error(res, {
                error: 'Categoría inválida',
                status: 400,
                route: this.routes
            });
        }

        const newSub = await Subcategorias.create({
            id_empresa,
            id_categoria,
            nombre_subcategoria,
            descripcion_subcategoria
        });

        return ApiResponse.success(res, {
            data: newSub,
            message: 'Subcategoría creada exitosamente',
            status: 201,
            route: this.routes
        });
    });

    static bulkStore = catchErrors(async (req, res) => {
        const items = req.body.map(item => ({ ...item, id_empresa: req.user.id_empresa })); // Inject id_empresa

        // Optional: Check if all categories exist? SQL foreign key constraint usually handles this causing error if invalid.
        // We will rely on DB constraints for efficiency or we could check.
        // Let's rely on DB but handle error if FK violation occurs? tryCatch wrapper usually catches Sequelize errors.

        const data = await Subcategorias.bulkCreate(items, { validate: true });

        return ApiResponse.success(res, {
            data,
            message: `${data.length} subcategorías creadas exitosamente`,
            status: 201,
            route: `${this.routes}/bulk`
        });
    });

    static update = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_categoria, nombre_subcategoria, descripcion_subcategoria } = req.body;
        const { id_empresa } = req.user;

        const sub = await Subcategorias.findOne({ where: { id, id_empresa } });
        if (!sub) {
            return ApiResponse.error(res, {
                error: 'Subcategoría no encontrada',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        if (id_categoria && id_categoria !== sub.id_categoria) {
            const cat = await Categorias.findOne({ where: { id: id_categoria, id_empresa } });
            if (!cat) {
                return ApiResponse.error(res, {
                    error: 'Categoría inválida',
                    status: 400,
                    route: `${this.routes}/${id}`
                });
            }
        }

        await sub.update({
            id_categoria,
            nombre_subcategoria,
            descripcion_subcategoria
        });

        return ApiResponse.success(res, {
            data: sub,
            message: 'Subcategoría actualizada exitosamente',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static destroy = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;
        const sub = await Subcategorias.findOne({ where: { id, id_empresa } });

        if (!sub) {
            return ApiResponse.error(res, {
                error: 'Subcategoría no encontrada',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        await sub.destroy();

        return ApiResponse.success(res, {
            data: null,
            message: 'Subcategoría eliminada (Soft Delete)',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static restore = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;
        const sub = await Subcategorias.findOne({
            where: { id, id_empresa },
            paranoid: false
        });

        if (!sub) {
            return ApiResponse.error(res, {
                error: 'Subcategoría no encontrada',
                status: 404,
                route: `${this.routes}/${id}/restore`
            });
        }

        if (!sub.deleted_at) {
            return ApiResponse.error(res, {
                error: 'La subcategoría no está eliminada',
                status: 400,
                route: `${this.routes}/${id}/restore`
            });
        }

        await sub.restore();

        return ApiResponse.success(res, {
            data: sub,
            message: 'Subcategoría restaurada correctamente',
            status: 200,
            route: `${this.routes}/${id}/restore`
        });
    });

    static forceDestroy = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;
        const sub = await Subcategorias.findOne({
            where: { id, id_empresa },
            paranoid: false
        });

        if (!sub) {
            return ApiResponse.error(res, {
                error: 'Subcategoría no encontrada',
                status: 404,
                route: `${this.routes}/${id}/force`
            });
        }

        await sub.destroy({ force: true });

        return ApiResponse.success(res, {
            data: null,
            message: 'Subcategoría eliminada definitivamente',
            status: 200,
            route: `${this.routes}/${id}/force`
        });
    });
}

module.exports = SubcategoriasController;
