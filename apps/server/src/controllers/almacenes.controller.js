const { Almacenes, StockAlmacenes, ProductoVariantes, Productos, sequelize } = require('../models');
const { Op } = require('sequelize');
const catchErrors = require('../utils/tryCatch');
const ApiResponse = require('../utils/apiResponse');
const getPaginatedQuery = require('../utils/getPaginatedQuery');

class AlmacenesController {
    static routes = '/almacenes';

    static index = catchErrors(async (req, res) => {
        const { query, limit, offset, order } = getPaginatedQuery(req.query);
        const { search } = req.query;
        const { id_empresa } = req.user;

        const where = { ...query, id_empresa };

        if (search) {
            where[Op.or] = [
                { nombre_almacen: { [Op.like]: `%${search}%` } },
                { ubicacion: { [Op.like]: `%${search}%` } }
            ];
        }

        const data = await Almacenes.findAndCountAll({
            where,
            limit,
            offset,
            order
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Almacenes obtenidos correctamente',
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
                { nombre_almacen: { [Op.like]: `%${search}%` } },
                { ubicacion: { [Op.like]: `%${search}%` } }
            ];
        }

        const data = await Almacenes.findAndCountAll({
            where,
            limit,
            offset,
            order,
            paranoid: false
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Papelera de almacenes obtenida correctamente',
            status: 200,
            route: `${this.routes}/trashed`
        });
    });

    static getById = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;

        const almacen = await Almacenes.findOne({
            where: { id, id_empresa }
        });

        if (!almacen) {
            return ApiResponse.error(res, {
                error: 'Almacén no encontrado',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        return ApiResponse.success(res, {
            data: almacen,
            message: 'Almacén obtenido correctamente',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static store = catchErrors(async (req, res) => {
        const { nombre_almacen, ubicacion, responsable, telefono, es_principal } = req.body;
        const { id, id_empresa } = req.user;

        // Validar si ya existe principal
        if (es_principal) {
            const existePrincipal = await Almacenes.findOne({
                where: { id_empresa, es_principal: true }
            });
            if (existePrincipal) {
                return ApiResponse.error(res, {
                    error: 'Ya existe un almacén principal',
                    status: 400
                });
            }
        }

        const newAlmacen = await Almacenes.create({
            id_empresa,
            nombre_almacen,
            ubicacion,
            responsable,
            telefono,
            es_principal: es_principal || false
        });

        return ApiResponse.success(res, {
            data: newAlmacen,
            message: 'Almacén creado exitosamente',
            status: 201,
            route: this.routes
        });
    });

    static update = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;
        const { nombre_almacen, ubicacion, responsable, telefono, es_principal, estado } = req.body;

        const almacen = await Almacenes.findOne({ where: { id, id_empresa } });
        if (!almacen) {
            return ApiResponse.error(res, { error: 'Almacén no encontrado', status: 404 });
        }

        if (es_principal && !almacen.es_principal) {
            // Check duplicidad solo si cambia a true
            const existePrincipal = await Almacenes.findOne({
                where: { id_empresa, es_principal: true, id: { [Op.ne]: id } }
            });
            if (existePrincipal) {
                return ApiResponse.error(res, {
                    error: 'Ya existe otro almacén principal',
                    status: 400
                });
            }
        }

        await almacen.update({
            nombre_almacen,
            ubicacion,
            responsable,
            telefono,
            es_principal,
            estado
        });

        return ApiResponse.success(res, {
            data: almacen,
            message: 'Almacén actualizado correctamente',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static destroy = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;

        const almacen = await Almacenes.findOne({ where: { id, id_empresa } });
        if (!almacen) {
            return ApiResponse.error(res, { error: 'Almacén no encontrado', status: 404 });
        }

        if (almacen.es_principal) {
            return ApiResponse.error(res, { error: 'No se puede eliminar el almacén principal', status: 400 });
        }

        await almacen.destroy();

        return ApiResponse.success(res, {
            data: null,
            message: 'Almacén eliminado (Soft Delete)',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static restore = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;

        const almacen = await Almacenes.findOne({ where: { id, id_empresa }, paranoid: false });
        if (!almacen) {
            return ApiResponse.error(res, { error: 'Almacén no encontrado', status: 404 });
        }

        if (!almacen.deleted_at) {
            return ApiResponse.error(res, { error: 'El almacén no está eliminado', status: 400 });
        }

        await almacen.restore();

        return ApiResponse.success(res, {
            data: almacen,
            message: 'Almacén restaurado correctamente',
            status: 200,
            route: `${this.routes}/${id}/restore`
        });
    });

    static forceDestroy = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;

        const almacen = await Almacenes.findOne({ where: { id, id_empresa }, paranoid: false });
        if (!almacen) {
            return ApiResponse.error(res, { error: 'Almacén no encontrado', status: 404 });
        }

        // Check referential integrity (Stock)
        const hasStock = await StockAlmacenes.count({ where: { id_almacen: id } });
        if (hasStock > 0) {
            return ApiResponse.error(res, { error: 'No se puede eliminar definitivamente un almacén con historial de stock', status: 400 });
        }

        await almacen.destroy({ force: true });

        return ApiResponse.success(res, {
            data: null,
            message: 'Almacén eliminado definitivamente',
            status: 200,
            route: `${this.routes}/${id}/force`
        });
    });

    static getStock = catchErrors(async (req, res) => {
        const { id } = req.params; // Warehouse ID
        const { query, limit, offset, order } = getPaginatedQuery(req.query);
        const { search } = req.query;
        const { id_empresa } = req.user;

        // Check permission
        const almacen = await Almacenes.findOne({ where: { id, id_empresa } });
        if (!almacen) return ApiResponse.error(res, { error: 'Almacén no encontrado', status: 404 });

        const where = { ...query, id_almacen: id };

        // Search in Product via Include
        const productInclude = {
            model: ProductoVariantes,
            as: 'variante',
            include: [{
                model: Productos,
                as: 'producto',
                where: search ? {
                    [Op.or]: [
                        { nombre_producto: { [Op.like]: `%${search}%` } },
                        { sku: { [Op.like]: `%${search}%` } } // SKU is usually on Variant but user might search logic
                    ]
                } : undefined
            }]
        };

        const data = await StockAlmacenes.findAndCountAll({
            where,
            include: [productInclude],
            limit,
            offset,
            order
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: `Stock del almacén ${almacen.nombre_almacen}`,
            status: 200,
            route: `${this.routes}/${id}/stock`
        });
    });
}

module.exports = AlmacenesController;
