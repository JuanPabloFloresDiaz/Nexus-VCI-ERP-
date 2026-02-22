const { Divisas } = require('../models');
const { Op } = require('sequelize');
const catchErrors = require('../utils/tryCatch');
const ApiResponse = require('../utils/apiResponse');
const getPaginatedQuery = require('../utils/getPaginatedQuery');

class DivisasController {
    static routes = '/divisas';

    static index = catchErrors(async (req, res) => {
        const { query, limit, offset, order } = getPaginatedQuery(req.query);
        const { search } = req.query;

        const where = { ...query };

        if (search) {
            where[Op.or] = [
                { nombre_divisa: { [Op.like]: `%${search}%` } },
                { codigo_iso: { [Op.like]: `%${search}%` } },
                { simbolo: { [Op.like]: `%${search}%` } }
            ];
        }

        const data = await Divisas.findAndCountAll({
            where,
            limit,
            offset,
            order
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Divisas obtenidas correctamente',
            status: 200,
            route: this.routes
        });
    });

    static getSelect = catchErrors(async (req, res) => {
        const data = await Divisas.findAll({
            attributes: ['id', 'nombre_divisa', 'codigo_iso', 'simbolo'],
            order: [['codigo_iso', 'ASC']]
        });

        return ApiResponse.success(res, {
            data,
            message: 'Lista de divisas obtenida correctamente',
            status: 200,
            route: `${this.routes}/select`
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
                { nombre_divisa: { [Op.like]: `%${search}%` } },
                { codigo_iso: { [Op.like]: `%${search}%` } }
            ];
        }

        const data = await Divisas.findAndCountAll({
            where,
            limit,
            offset,
            order,
            paranoid: false
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Papelera de divisas obtenida correctamente',
            status: 200,
            route: `${this.routes}/trashed`
        });
    });

    static getById = catchErrors(async (req, res) => {
        const { id } = req.params;

        const divisa = await Divisas.findOne({
            where: { id }
        });

        if (!divisa) {
            return ApiResponse.error(res, {
                error: 'Divisa no encontrada',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        return ApiResponse.success(res, {
            data: divisa,
            message: 'Divisa obtenida correctamente',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static store = catchErrors(async (req, res) => {
        const { nombre_divisa, codigo_iso, simbolo } = req.body;

        const existe = await Divisas.findOne({ where: { codigo_iso } });
        if (existe) {
            return ApiResponse.error(res, { error: 'Ya existe una divisa con ese código ISO', status: 400 });
        }

        const newDivisa = await Divisas.create({
            nombre_divisa,
            codigo_iso,
            simbolo
        });

        return ApiResponse.success(res, {
            data: newDivisa,
            message: 'Divisa creada exitosamente',
            status: 201,
            route: this.routes
        });
    });

    static update = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { nombre_divisa, codigo_iso, simbolo, estado } = req.body;

        const divisa = await Divisas.findByPk(id);
        if (!divisa) {
            return ApiResponse.error(res, { error: 'Divisa no encontrada', status: 404 });
        }

        if (codigo_iso && codigo_iso !== divisa.codigo_iso) {
            const existe = await Divisas.findOne({ where: { codigo_iso } });
            if (existe) {
                return ApiResponse.error(res, { error: 'Ya existe una divisa con ese código ISO', status: 400 });
            }
        }

        await divisa.update({ nombre_divisa, codigo_iso, simbolo, estado });

        return ApiResponse.success(res, {
            data: divisa,
            message: 'Divisa actualizada correctamente',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static destroy = catchErrors(async (req, res) => {
        const { id } = req.params;

        const divisa = await Divisas.findByPk(id);
        if (!divisa) {
            return ApiResponse.error(res, { error: 'Divisa no encontrada', status: 404 });
        }

        await divisa.destroy();

        return ApiResponse.success(res, {
            data: null,
            message: 'Divisa eliminada (Soft Delete)',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static restore = catchErrors(async (req, res) => {
        const { id } = req.params;

        const divisa = await Divisas.findOne({ where: { id }, paranoid: false });
        if (!divisa) {
            return ApiResponse.error(res, { error: 'Divisa no encontrada', status: 404 });
        }

        if (!divisa.deleted_at) {
            return ApiResponse.error(res, { error: 'La divisa no está eliminada', status: 400 });
        }

        await divisa.restore();

        return ApiResponse.success(res, {
            data: divisa,
            message: 'Divisa restaurada correctamente',
            status: 200,
            route: `${this.routes}/${id}/restore`
        });
    });

    static forceDestroy = catchErrors(async (req, res) => {
        const { id } = req.params;

        const divisa = await Divisas.findOne({ where: { id }, paranoid: false });
        if (!divisa) {
            return ApiResponse.error(res, { error: 'Divisa no encontrada', status: 404 });
        }

        await divisa.destroy({ force: true });

        return ApiResponse.success(res, {
            data: null,
            message: 'Divisa eliminada definitivamente',
            status: 200,
            route: `${this.routes}/${id}/force`
        });
    });
}

module.exports = DivisasController;
