const { OpcionesFiltro, Filtros } = require('../models');
const { Op } = require('sequelize');
const catchErrors = require('../utils/tryCatch');
const ApiResponse = require('../utils/apiResponse');
const getPaginatedQuery = require('../utils/getPaginatedQuery');

class OpcionesFiltroController {
    static routes = '/opciones-filtro';

    static index = catchErrors(async (req, res) => {
        const { query, limit, offset, order } = getPaginatedQuery(req.query);
        const { search } = req.query;

        const where = { ...query };

        if (search) {
            where[Op.or] = [
                { valor_opcion: { [Op.like]: `%${search}%` } }
            ];
        }

        const data = await OpcionesFiltro.findAndCountAll({
            where,
            limit,
            offset,
            order,
            include: [{
                model: Filtros,
                as: 'filtro',
                attributes: ['id', 'nombre_filtro']
            }]
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Listado de opciones obtenido correctamente',
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
                { valor_opcion: { [Op.like]: `%${search}%` } }
            ];
        }

        const data = await OpcionesFiltro.findAndCountAll({
            where,
            limit,
            offset,
            order,
            paranoid: false,
            include: [{
                model: Filtros,
                as: 'filtro',
                attributes: ['id', 'nombre_filtro'],
                paranoid: false
            }]
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Papelera de opciones obtenida correctamente',
            status: 200,
            route: `${this.routes}/trashed`
        });
    });

    static store = catchErrors(async (req, res) => {
        const { id_filtro, valor_opcion } = req.body;

        const filtro = await Filtros.findByPk(id_filtro);
        if (!filtro) {
            return ApiResponse.error(res, {
                error: 'Filtro no encontrado',
                status: 404,
                route: this.routes
            });
        }

        const newOpcion = await OpcionesFiltro.create({
            id_filtro,
            valor_opcion
        });

        return ApiResponse.success(res, {
            data: newOpcion,
            message: 'Opción creada exitosamente',
            status: 201,
            route: this.routes
        });
    });

    static bulkStore = catchErrors(async (req, res) => {
        const { id_filtro, opciones } = req.body; // opciones is array of strings

        const filtro = await Filtros.findByPk(id_filtro);
        if (!filtro) {
            return ApiResponse.error(res, {
                error: 'Filtro no encontrado',
                status: 404,
                route: `${this.routes}/bulk-options`
            });
        }

        const optionsToCreate = opciones.map(val => ({
            id_filtro,
            valor_opcion: val
        }));

        const data = await OpcionesFiltro.bulkCreate(optionsToCreate, { validate: true });

        return ApiResponse.success(res, {
            data,
            message: `${data.length} opciones creadas exitosamente`,
            status: 201,
            route: `${this.routes}/bulk-options`
        });
    });

    static update = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_filtro, valor_opcion } = req.body;

        const opcion = await OpcionesFiltro.findByPk(id);
        if (!opcion) {
            return ApiResponse.error(res, {
                error: 'Opción no encontrada',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        if (id_filtro && id_filtro !== opcion.id_filtro) {
            const f = await Filtros.findByPk(id_filtro);
            if (!f) {
                return ApiResponse.error(res, {
                    error: 'Filtro inválido',
                    status: 400,
                    route: `${this.routes}/${id}`
                });
            }
        }

        await opcion.update({
            id_filtro,
            valor_opcion
        });

        return ApiResponse.success(res, {
            data: opcion,
            message: 'Opción actualizada exitosamente',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static destroy = catchErrors(async (req, res) => {
        const { id } = req.params;
        const opcion = await OpcionesFiltro.findByPk(id);

        if (!opcion) {
            return ApiResponse.error(res, {
                error: 'Opción no encontrada',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        await opcion.destroy();

        return ApiResponse.success(res, {
            data: null,
            message: 'Opción eliminada (Soft Delete)',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static restore = catchErrors(async (req, res) => {
        const { id } = req.params;
        const opcion = await OpcionesFiltro.findByPk(id, { paranoid: false });

        if (!opcion) {
            return ApiResponse.error(res, {
                error: 'Opción no encontrada',
                status: 404,
                route: `${this.routes}/${id}/restore`
            });
        }

        if (!opcion.deleted_at) {
            return ApiResponse.error(res, {
                error: 'La opción no está eliminada',
                status: 400,
                route: `${this.routes}/${id}/restore`
            });
        }

        await opcion.restore();

        return ApiResponse.success(res, {
            data: opcion,
            message: 'Opción restaurada correctamente',
            status: 200,
            route: `${this.routes}/${id}/restore`
        });
    });

    static forceDestroy = catchErrors(async (req, res) => {
        const { id } = req.params;
        const opcion = await OpcionesFiltro.findByPk(id, { paranoid: false });

        if (!opcion) {
            return ApiResponse.error(res, {
                error: 'Opción no encontrada',
                status: 404,
                route: `${this.routes}/${id}/force`
            });
        }

        await opcion.destroy({ force: true });

        return ApiResponse.success(res, {
            data: null,
            message: 'Opción eliminada definitivamente',
            status: 200,
            route: `${this.routes}/${id}/force`
        });
    });
}

module.exports = OpcionesFiltroController;
