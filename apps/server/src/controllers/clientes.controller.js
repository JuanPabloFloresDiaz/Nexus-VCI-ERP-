const { Clientes } = require('../models');
const { Op } = require('sequelize');
const catchErrors = require('../utils/tryCatch');
const ApiResponse = require('../utils/apiResponse');
const getPaginatedQuery = require('../utils/getPaginatedQuery');

class ClientesController {
    static routes = '/clientes';

    static index = catchErrors(async (req, res) => {
        const { query, limit, offset, order } = getPaginatedQuery(req.query);
        const { search } = req.query;
        const { id_empresa } = req.user;

        const where = { ...query, id_empresa };

        if (search) {
            where[Op.or] = [
                { nombre_cliente: { [Op.like]: `%${search}%` } },
                { apellido_cliente: { [Op.like]: `%${search}%` } },
                { dui_cliente: { [Op.like]: `%${search}%` } },
                { telefono_cliente: { [Op.like]: `%${search}%` } },
                { correo_cliente: { [Op.like]: `%${search}%` } }
            ];
        }

        const data = await Clientes.findAndCountAll({
            where,
            limit,
            offset,
            order
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Listado de clientes obtenido correctamente',
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
                { nombre_cliente: { [Op.like]: `%${search}%` } },
                { apellido_cliente: { [Op.like]: `%${search}%` } },
                { dui_cliente: { [Op.like]: `%${search}%` } },
                { telefono_cliente: { [Op.like]: `%${search}%` } },
                { correo_cliente: { [Op.like]: `%${search}%` } }
            ];
        }

        const data = await Clientes.findAndCountAll({
            where,
            limit,
            offset,
            order,
            paranoid: false
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Papelera de clientes obtenida correctamente',
            status: 200,
            route: `${this.routes}/trashed`
        });
    });

    static all = catchErrors(async (req, res) => {
        const { id_empresa } = req.user;
        const data = await Clientes.findAll({
            where: { id_empresa },
            attributes: ['id', 'nombre_cliente', 'apellido_cliente'],
            // Assuming we only want not-deleted (paranoid default)
        });

        return ApiResponse.success(res, {
            data,
            message: 'Listado rápido de clientes obtenido correctamente',
            status: 200,
            route: `${this.routes}/all`
        });
    });

    static store = catchErrors(async (req, res) => {
        const { nombre_cliente, apellido_cliente, dui_cliente, telefono_cliente, correo_cliente } = req.body;
        const { id_empresa } = req.user;

        // Check for existing Dui
        if (dui_cliente) {
            const existingDui = await Clientes.findOne({ where: { dui_cliente, id_empresa } });
            if (existingDui) {
                return ApiResponse.error(res, {
                    error: 'El DUI ya está registrado',
                    status: 400,
                    route: this.routes
                });
            }
        }

        // Check for existing Email
        const existingEmail = await Clientes.findOne({ where: { correo_cliente, id_empresa } });
        if (existingEmail) {
            return ApiResponse.error(res, {
                error: 'El correo electrónico ya está registrado',
                status: 400,
                route: this.routes
            });
        }

        const newCliente = await Clientes.create({
            id_empresa,
            nombre_cliente,
            apellido_cliente,
            dui_cliente,
            telefono_cliente,
            correo_cliente
        });

        return ApiResponse.success(res, {
            data: newCliente,
            message: 'Cliente registrado exitosamente',
            status: 201,
            route: this.routes
        });
    });

    static bulkStore = catchErrors(async (req, res) => {
        const items = req.body.map(item => ({ ...item, id_empresa: req.user.id_empresa }));

        const result = await Clientes.sequelize.transaction(async (t) => {
            // Using bulkCreate. Note: This will fail if any unique constraint is violated (email/dui).
            // validate: true ensures model validations run.
            return await Clientes.bulkCreate(items, { validate: true, transaction: t });
        });

        return ApiResponse.success(res, {
            data: result,
            message: `${result.length} clientes creados exitosamente`,
            status: 201,
            route: `${this.routes}/bulk`
        });
    });

    static update = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { nombre_cliente, apellido_cliente, dui_cliente, telefono_cliente, correo_cliente } = req.body;
        const { id_empresa } = req.user;

        const cliente = await Clientes.findOne({ where: { id, id_empresa } });
        if (!cliente) {
            return ApiResponse.error(res, {
                error: 'Cliente no encontrado',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        // Validate Unique Email
        if (correo_cliente && correo_cliente !== cliente.correo_cliente) {
            const existingEmail = await Clientes.findOne({
                where: {
                    correo_cliente,
                    id_empresa,
                    id: { [Op.ne]: id }
                }
            });
            if (existingEmail) {
                return ApiResponse.error(res, {
                    error: 'El correo electrónico ya está en uso por otro cliente',
                    status: 400,
                    route: `${this.routes}/${id}`
                });
            }
        }

        // Validate Unique DUI
        if (dui_cliente && dui_cliente !== cliente.dui_cliente) {
            const existingDui = await Clientes.findOne({
                where: {
                    dui_cliente,
                    id_empresa,
                    id: { [Op.ne]: id }
                }
            });
            if (existingDui) {
                return ApiResponse.error(res, {
                    error: 'El DUI ya está registrado por otro cliente',
                    status: 400,
                    route: `${this.routes}/${id}`
                });
            }
        }

        await cliente.update({
            nombre_cliente,
            apellido_cliente,
            dui_cliente,
            telefono_cliente,
            correo_cliente
        });

        return ApiResponse.success(res, {
            data: cliente,
            message: 'Cliente actualizado exitosamente',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static destroy = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;

        const cliente = await Clientes.findOne({ where: { id, id_empresa } });
        if (!cliente) {
            return ApiResponse.error(res, {
                error: 'Cliente no encontrado',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        await cliente.destroy(); // Soft delete

        return ApiResponse.success(res, {
            data: null,
            message: 'Cliente eliminado correctamente (Soft Delete)',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static restore = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;

        const cliente = await Clientes.findOne({
            where: { id, id_empresa },
            paranoid: false
        });

        if (!cliente) {
            return ApiResponse.error(res, {
                error: 'Cliente no encontrado',
                status: 404,
                route: `${this.routes}/${id}/restore`
            });
        }

        if (!cliente.deleted_at) {
            return ApiResponse.error(res, {
                error: 'El cliente no está eliminado',
                status: 400,
                route: `${this.routes}/${id}/restore`
            });
        }

        await cliente.restore();

        return ApiResponse.success(res, {
            data: cliente,
            message: 'Cliente restaurado correctamente',
            status: 200,
            route: `${this.routes}/${id}/restore`
        });
    });

    static forceDestroy = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;

        const cliente = await Clientes.findOne({
            where: { id, id_empresa },
            paranoid: false
        });
        if (!cliente) {
            return ApiResponse.error(res, {
                error: 'Cliente no encontrado',
                status: 404,
                route: `${this.routes}/${id}/force`
            });
        }

        await cliente.destroy({ force: true });

        return ApiResponse.success(res, {
            data: null,
            message: 'Cliente eliminado definitivamente',
            status: 200,
            route: `${this.routes}/${id}/force`
        });
    });
}

module.exports = ClientesController;
