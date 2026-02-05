const { Proveedores, Compras } = require('../models');
const { Op } = require('sequelize');
const catchErrors = require('../utils/tryCatch');
const ApiResponse = require('../utils/apiResponse');
const getPaginatedQuery = require('../utils/getPaginatedQuery');

class ProveedoresController {
    static routes = '/proveedores';

    static index = catchErrors(async (req, res) => {
        const { query, limit, offset, order } = getPaginatedQuery(req.query);
        const { search } = req.query;
        const { id_empresa } = req.user;

        const where = { ...query, id_empresa };

        if (search) {
            where[Op.or] = [
                { nombre_proveedor: { [Op.like]: `%${search}%` } },
                { contacto_nombre: { [Op.like]: `%${search}%` } },
                { correo_proveedor: { [Op.like]: `%${search}%` } }
            ];
        }

        const data = await Proveedores.findAndCountAll({
            where,
            limit,
            offset,
            order
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Listado de proveedores obtenido correctamente',
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
                { nombre_proveedor: { [Op.like]: `%${search}%` } },
                { contacto_nombre: { [Op.like]: `%${search}%` } }
            ];
        }

        const data = await Proveedores.findAndCountAll({
            where,
            limit,
            offset,
            order,
            paranoid: false
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Papelera de proveedores obtenida correctamente',
            status: 200,
            route: `${this.routes}/trashed`
        });
    });

    static getById = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;

        const proveedor = await Proveedores.findOne({
            where: { id, id_empresa },
            include: [{
                model: Compras,
                as: 'compras',
                limit: 5,
                order: [['created_at', 'DESC']],
                attributes: ['id', 'total_compra', 'created_at', 'estado_compra']
            }]
        });

        if (!proveedor) {
            return ApiResponse.error(res, {
                error: 'Proveedor no encontrado',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        return ApiResponse.success(res, {
            data: proveedor,
            message: 'Proveedor obtenido correctamente',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static store = catchErrors(async (req, res) => {
        const { nombre_proveedor, contacto_nombre, telefono_proveedor, correo_proveedor } = req.body;
        const { id_empresa } = req.user;

        // Check for existing provider name in same company (optional constraint but good practice)
        const existing = await Proveedores.findOne({ where: { nombre_proveedor, id_empresa } });
        if (existing) {
            return ApiResponse.error(res, {
                error: 'Ya existe un proveedor con este nombre',
                status: 400,
                route: this.routes
            });
        }

        const newProveedor = await Proveedores.create({
            id_empresa,
            nombre_proveedor,
            contacto_nombre,
            telefono_proveedor,
            correo_proveedor
        });

        return ApiResponse.success(res, {
            data: newProveedor,
            message: 'Proveedor creado exitosamente',
            status: 201,
            route: this.routes
        });
    });

    static bulkStore = catchErrors(async (req, res) => {
        const items = req.body.map(item => ({ ...item, id_empresa: req.user.id_empresa }));

        const result = await Proveedores.bulkCreate(items, { validate: true });

        return ApiResponse.success(res, {
            data: result,
            message: `${result.length} proveedores creados exitosamente`,
            status: 201,
            route: `${this.routes}/bulk`
        });
    });

    static update = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { nombre_proveedor, contacto_nombre, telefono_proveedor, correo_proveedor } = req.body;
        const { id_empresa } = req.user;

        const proveedor = await Proveedores.findOne({ where: { id, id_empresa } });
        if (!proveedor) {
            return ApiResponse.error(res, {
                error: 'Proveedor no encontrado',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        if (nombre_proveedor && nombre_proveedor !== proveedor.nombre_proveedor) {
            const existing = await Proveedores.findOne({
                where: {
                    nombre_proveedor,
                    id_empresa,
                    id: { [Op.ne]: id }
                }
            });
            if (existing) {
                return ApiResponse.error(res, {
                    error: 'Ya existe un proveedor con este nombre',
                    status: 400,
                    route: `${this.routes}/${id}`
                });
            }
        }

        await proveedor.update({
            nombre_proveedor,
            contacto_nombre,
            telefono_proveedor,
            correo_proveedor
        });

        return ApiResponse.success(res, {
            data: proveedor,
            message: 'Proveedor actualizado exitosamente',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static destroy = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;
        const proveedor = await Proveedores.findOne({ where: { id, id_empresa } });

        if (!proveedor) {
            return ApiResponse.error(res, {
                error: 'Proveedor no encontrado',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        await proveedor.destroy();

        return ApiResponse.success(res, {
            data: null,
            message: 'Proveedor eliminado (Soft Delete)',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static restore = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;
        const proveedor = await Proveedores.findOne({
            where: { id, id_empresa },
            paranoid: false
        });

        if (!proveedor) {
            return ApiResponse.error(res, {
                error: 'Proveedor no encontrado',
                status: 404,
                route: `${this.routes}/${id}/restore`
            });
        }

        if (!proveedor.deleted_at) {
            return ApiResponse.error(res, {
                error: 'El proveedor no está eliminado',
                status: 400,
                route: `${this.routes}/${id}/restore`
            });
        }

        await proveedor.restore();

        return ApiResponse.success(res, {
            data: proveedor,
            message: 'Proveedor restaurado correctamente',
            status: 200,
            route: `${this.routes}/${id}/restore`
        });
    });

    static forceDestroy = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;
        const proveedor = await Proveedores.findOne({
            where: { id, id_empresa },
            paranoid: false
        });

        if (!proveedor) {
            return ApiResponse.error(res, {
                error: 'Proveedor no encontrado',
                status: 404,
                route: `${this.routes}/${id}/force`
            });
        }

        await proveedor.destroy({ force: true });

        return ApiResponse.success(res, {
            data: null,
            message: 'Proveedor eliminado definitivamente',
            status: 200,
            route: `${this.routes}/${id}/force`
        });
    });
}

module.exports = ProveedoresController;
