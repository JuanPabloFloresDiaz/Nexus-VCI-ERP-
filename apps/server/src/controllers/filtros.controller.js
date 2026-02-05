const { Filtros, OpcionesFiltro, Subcategorias } = require('../models');
const { Op } = require('sequelize');
const catchErrors = require('../utils/tryCatch');
const ApiResponse = require('../utils/apiResponse');
const getPaginatedQuery = require('../utils/getPaginatedQuery');

class FiltrosController {
    static routes = '/filtros';

    static index = catchErrors(async (req, res) => {
        const { query, limit, offset, order } = getPaginatedQuery(req.query);
        const { search } = req.query;

        const where = { ...query };

        if (search) {
            where[Op.or] = [
                { nombre_filtro: { [Op.like]: `%${search}%` } },
                { tipo_dato: { [Op.like]: `%${search}%` } }
            ];
        }

        const data = await Filtros.findAndCountAll({
            where,
            limit,
            offset,
            order,
            include: [{
                model: Subcategorias,
                as: 'subcategoria',
                attributes: ['id', 'nombre_subcategoria']
            }]
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Listado de filtros obtenido correctamente',
            status: 200,
            route: this.routes
        });
    });

    static trashed = catchErrors(async (req, res) => {
        const { query, limit, offset, order } = getPaginatedQuery(req.query);
        const { search } = req.query;

        const where = {
            ...query,
            deleted_at: { [Op.not]: null }
        };

        if (search) {
            where[Op.or] = [
                { nombre_filtro: { [Op.like]: `%${search}%` } },
                { tipo_dato: { [Op.like]: `%${search}%` } }
            ];
        }

        const data = await Filtros.findAndCountAll({
            where,
            limit,
            offset,
            order,
            paranoid: false,
            include: [{
                model: Subcategorias,
                as: 'subcategoria',
                attributes: ['id', 'nombre_subcategoria'],
                paranoid: false
            }]
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Papelera de filtros obtenida correctamente',
            status: 200,
            route: `${this.routes}/trashed`
        });
    });

    static getBySubcategoria = catchErrors(async (req, res) => {
        const { id } = req.params;

        const subcategoria = await Subcategorias.findByPk(id);
        if (!subcategoria) {
            return ApiResponse.error(res, {
                error: 'Subcategoría no encontrada',
                status: 404,
                route: `${this.routes}/by-subcategoria/${id}`
            });
        }

        const filtros = await Filtros.findAll({
            where: { id_subcategoria: id },
            include: [{
                model: OpcionesFiltro,
                as: 'opciones',
                attributes: ['id', 'valor_opcion'],
                order: [['valor_opcion', 'ASC']]
            }],
            order: [['nombre_filtro', 'ASC']]
        });

        return ApiResponse.success(res, {
            data: filtros,
            message: `Filtros de ${subcategoria.nombre_subcategoria} obtenidos correctamente`,
            status: 200,
            route: `${this.routes}/by-subcategoria/${id}`
        });
    });

    static store = catchErrors(async (req, res) => {
        const { id_subcategoria, nombre_filtro, tipo_dato } = req.body;

        const subcategoria = await Subcategorias.findByPk(id_subcategoria);
        if (!subcategoria) {
            return ApiResponse.error(res, {
                error: 'Subcategoría inválida',
                status: 400,
                route: this.routes
            });
        }

        const newFiltro = await Filtros.create({
            id_subcategoria,
            nombre_filtro,
            tipo_dato
        });

        return ApiResponse.success(res, {
            data: newFiltro,
            message: 'Filtro creado exitosamente',
            status: 201,
            route: this.routes
        });
    });

    static update = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_subcategoria, nombre_filtro, tipo_dato } = req.body;

        const filtro = await Filtros.findByPk(id);
        if (!filtro) {
            return ApiResponse.error(res, {
                error: 'Filtro no encontrado',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        if (id_subcategoria && id_subcategoria !== filtro.id_subcategoria) {
            const sub = await Subcategorias.findByPk(id_subcategoria);
            if (!sub) {
                return ApiResponse.error(res, {
                    error: 'Subcategoría inválida',
                    status: 400,
                    route: `${this.routes}/${id}`
                });
            }
        }

        await filtro.update({
            id_subcategoria,
            nombre_filtro,
            tipo_dato
        });

        return ApiResponse.success(res, {
            data: filtro,
            message: 'Filtro actualizado exitosamente',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static destroy = catchErrors(async (req, res) => {
        const { id } = req.params;
        const filtro = await Filtros.findByPk(id);

        if (!filtro) {
            return ApiResponse.error(res, {
                error: 'Filtro no encontrado',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        await filtro.destroy();

        return ApiResponse.success(res, {
            data: null,
            message: 'Filtro eliminado (Soft Delete)',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static restore = catchErrors(async (req, res) => {
        const { id } = req.params;
        const filtro = await Filtros.findByPk(id, { paranoid: false });

        if (!filtro) {
            return ApiResponse.error(res, {
                error: 'Filtro no encontrado',
                status: 404,
                route: `${this.routes}/${id}/restore`
            });
        }

        if (!filtro.deleted_at) {
            return ApiResponse.error(res, {
                error: 'El filtro no está eliminado',
                status: 400,
                route: `${this.routes}/${id}/restore`
            });
        }

        await filtro.restore();

        return ApiResponse.success(res, {
            data: filtro,
            message: 'Filtro restaurado correctamente',
            status: 200,
            route: `${this.routes}/${id}/restore`
        });
    });

    static forceDestroy = catchErrors(async (req, res) => {
        const { id } = req.params;
        const filtro = await Filtros.findByPk(id, { paranoid: false });

        if (!filtro) {
            return ApiResponse.error(res, {
                error: 'Filtro no encontrado',
                status: 404,
                route: `${this.routes}/${id}/force`
            });
        }

        await filtro.destroy({ force: true });

        return ApiResponse.success(res, {
            data: null,
            message: 'Filtro eliminado definitivamente',
            status: 200,
            route: `${this.routes}/${id}/force`
        });
    });
}

module.exports = FiltrosController;
