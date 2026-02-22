const { TasasCambio, Divisas } = require('../models');
const { Op } = require('sequelize');
const catchErrors = require('../utils/tryCatch');
const ApiResponse = require('../utils/apiResponse');
const getPaginatedQuery = require('../utils/getPaginatedQuery');

class TasasCambioController {
    static routes = '/tasas-cambio';

    static index = catchErrors(async (req, res) => {
        const { query, limit, offset, order } = getPaginatedQuery(req.query);
        const { search } = req.query;

        const where = { ...query };

        if (search) {
            where[Op.or] = [
                { codigo_iso_origen: { [Op.like]: `%${search}%` } },
                { codigo_iso_destino: { [Op.like]: `%${search}%` } }
            ];
        }

        const data = await TasasCambio.findAndCountAll({
            where,
            include: [
                { model: Divisas, as: 'divisa_origen', attributes: ['nombre_divisa', 'simbolo'] },
                { model: Divisas, as: 'divisa_destino', attributes: ['nombre_divisa', 'simbolo'] }
            ],
            limit,
            offset,
            order
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Tasas de cambio obtenidas correctamente',
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
                { codigo_iso_origen: { [Op.like]: `%${search}%` } },
                { codigo_iso_destino: { [Op.like]: `%${search}%` } }
            ];
        }

        const data = await TasasCambio.findAndCountAll({
            where,
            include: [
                { model: Divisas, as: 'divisa_origen', attributes: ['nombre_divisa', 'simbolo'] },
                { model: Divisas, as: 'divisa_destino', attributes: ['nombre_divisa', 'simbolo'] }
            ],
            limit,
            offset,
            order,
            paranoid: false
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Papelera de tasas de cambio obtenida correctamente',
            status: 200,
            route: `${this.routes}/trashed`
        });
    });

    static getById = catchErrors(async (req, res) => {
        const { id } = req.params;

        const tasa = await TasasCambio.findOne({
            where: { id },
            include: [
                { model: Divisas, as: 'divisa_origen', attributes: ['nombre_divisa', 'simbolo'] },
                { model: Divisas, as: 'divisa_destino', attributes: ['nombre_divisa', 'simbolo'] }
            ]
        });

        if (!tasa) {
            return ApiResponse.error(res, {
                error: 'Tasa de cambio no encontrada',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        return ApiResponse.success(res, {
            data: tasa,
            message: 'Tasa de cambio obtenida correctamente',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static store = catchErrors(async (req, res) => {
        const { codigo_iso_origen, codigo_iso_destino, tasa_cambio } = req.body;

        if (codigo_iso_origen === codigo_iso_destino) {
            return ApiResponse.error(res, { error: 'La divisa de origen y destino no pueden ser la misma', status: 400 });
        }

        const existe = await TasasCambio.findOne({
            where: { codigo_iso_origen, codigo_iso_destino }
        });

        if (existe) {
            return ApiResponse.error(res, { error: 'Ya existe una tasa para ese par de divisas', status: 400 });
        }

        const newTasa = await TasasCambio.create({
            codigo_iso_origen,
            codigo_iso_destino,
            tasa_cambio
        });

        return ApiResponse.success(res, {
            data: newTasa,
            message: 'Tasa de cambio creada exitosamente',
            status: 201,
            route: this.routes
        });
    });

    static update = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { codigo_iso_origen, codigo_iso_destino, tasa_cambio, estado } = req.body;

        const tasa = await TasasCambio.findByPk(id);
        if (!tasa) {
            return ApiResponse.error(res, { error: 'Tasa de cambio no encontrada', status: 404 });
        }

        await tasa.update({ codigo_iso_origen, codigo_iso_destino, tasa_cambio, estado });

        return ApiResponse.success(res, {
            data: tasa,
            message: 'Tasa de cambio actualizada correctamente',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static destroy = catchErrors(async (req, res) => {
        const { id } = req.params;

        const tasa = await TasasCambio.findByPk(id);
        if (!tasa) {
            return ApiResponse.error(res, { error: 'Tasa de cambio no encontrada', status: 404 });
        }

        await tasa.destroy();

        return ApiResponse.success(res, {
            data: null,
            message: 'Tasa eliminada (Soft Delete)',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static restore = catchErrors(async (req, res) => {
        const { id } = req.params;

        const tasa = await TasasCambio.findOne({ where: { id }, paranoid: false });
        if (!tasa) {
            return ApiResponse.error(res, { error: 'Tasa de cambio no encontrada', status: 404 });
        }

        if (!tasa.deleted_at) {
            return ApiResponse.error(res, { error: 'La tasa no está eliminada', status: 400 });
        }

        await tasa.restore();

        return ApiResponse.success(res, {
            data: tasa,
            message: 'Tasa de cambio restaurada correctamente',
            status: 200,
            route: `${this.routes}/${id}/restore`
        });
    });

    static forceDestroy = catchErrors(async (req, res) => {
        const { id } = req.params;

        const tasa = await TasasCambio.findOne({ where: { id }, paranoid: false });
        if (!tasa) {
            return ApiResponse.error(res, { error: 'Tasa de cambio no encontrada', status: 404 });
        }

        await tasa.destroy({ force: true });

        return ApiResponse.success(res, {
            data: null,
            message: 'Tasa eliminada definitivamente',
            status: 200,
            route: `${this.routes}/${id}/force`
        });
    });
}

module.exports = TasasCambioController;
