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
        const { id_empresa, rol_usuario } = req.user;

        const where = { ...query };

        // Si NO es SuperAdministrador, filtrar por su empresa
        if (rol_usuario !== 'SuperAdministrador') {
            where.id_empresa = id_empresa;
        } else if (req.query.id_empresa) {
            // Si es SuperAdmin y envía id_empresa, filtrar por esa empresa
            where.id_empresa = req.query.id_empresa;
        }

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
            include: [
                { model: require('../models').Empresas, as: 'empresa', attributes: ['id', 'nombre_empresa'] }
            ]
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
        const { id_empresa, rol_usuario } = req.user;

        const where = {
            ...query,
            deleted_at: { [Op.not]: null }
        };

        if (rol_usuario !== 'SuperAdministrador') {
            where.id_empresa = id_empresa;
        } else if (req.query.id_empresa) {
            where.id_empresa = req.query.id_empresa;
        }

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
            paranoid: false,
            include: [
                { model: require('../models').Empresas, as: 'empresa', attributes: ['id', 'nombre_empresa'] }
            ]
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
        const { id_empresa, rol_usuario } = req.user;
        const where = {};

        if (rol_usuario !== 'SuperAdministrador') {
            where.id_empresa = id_empresa;
        }

        const data = await Clientes.findAll({
            where,
            attributes: ['id', 'nombre_cliente', 'apellido_cliente'],
        });

        return ApiResponse.success(res, {
            data,
            message: 'Listado rápido de clientes obtenido correctamente',
            status: 200,
            route: `${this.routes}/all`
        });
    });

    static store = catchErrors(async (req, res) => {
        const { nombre_cliente, apellido_cliente, dui_cliente, telefono_cliente, correo_cliente, id_empresa: bodyIdEmpresa } = req.body;
        const { id_empresa: userIdEmpresa, rol_usuario } = req.user;

        // Determinar ID empresa
        let targetIdEmpresa = userIdEmpresa;
        if (rol_usuario === 'SuperAdministrador' && bodyIdEmpresa) {
            targetIdEmpresa = bodyIdEmpresa;
        }

        // Check for existing Dui
        if (dui_cliente) {
            const existingDui = await Clientes.findOne({ where: { dui_cliente, id_empresa: targetIdEmpresa } });
            if (existingDui) {
                return ApiResponse.error(res, {
                    error: 'El DUI ya está registrado',
                    status: 400,
                    route: this.routes
                });
            }
        }

        // Check for existing Email
        const existingEmail = await Clientes.findOne({ where: { correo_cliente, id_empresa: targetIdEmpresa } });
        if (existingEmail) {
            return ApiResponse.error(res, {
                error: 'El correo electrónico ya está registrado',
                status: 400,
                route: this.routes
            });
        }

        const newCliente = await Clientes.create({
            id_empresa: targetIdEmpresa,
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
        const { rol_usuario, id_empresa: userIdEmpresa } = req.user;

        // Prepare items with correct id_empresa
        const items = req.body.map(item => {
            let targetIdEmpresa = userIdEmpresa;
            // Si es SuperAdmin y el item tiene id_empresa, usar esa. Si no, usar la del usuario (si es vendor/admin) o error?
            // El SuperAdmin podría enviar id_empresa en cada item o heredar la suya (que no tiene sentido porque no debe tener registros propios usualmente).
            // Asumiremos que si es SuperAdmin, debe venir en el body o se asigna a una por defecto si se pasara (pero mejor respetar lógica store).

            if (rol_usuario === 'SuperAdministrador' && item.id_empresa) {
                targetIdEmpresa = item.id_empresa;
            }
            // Si no es SuperAdmin, forzar su empresa
            if (rol_usuario !== 'SuperAdministrador') {
                targetIdEmpresa = userIdEmpresa;
            }

            return { ...item, id_empresa: targetIdEmpresa };
        });

        const result = await Clientes.sequelize.transaction(async (t) => {
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
        const { nombre_cliente, apellido_cliente, dui_cliente, telefono_cliente, correo_cliente, id_empresa: bodyIdEmpresa } = req.body;
        const { id_empresa: userIdEmpresa, rol_usuario } = req.user;

        const where = { id };
        if (rol_usuario !== 'SuperAdministrador') {
            where.id_empresa = userIdEmpresa;
        }

        const cliente = await Clientes.findOne({ where });
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
                    id_empresa: cliente.id_empresa,
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
                    id_empresa: cliente.id_empresa,
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

        // Update company only if SuperAdmin
        if (rol_usuario === 'SuperAdministrador' && bodyIdEmpresa) {
            cliente.id_empresa = bodyIdEmpresa;
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
        const { id_empresa, rol_usuario } = req.user;

        // Vendedor no puede eliminar
        if (rol_usuario === 'Vendedor') {
            return ApiResponse.error(res, {
                error: 'No tienes permisos para eliminar clientes',
                status: 403,
                route: `${this.routes}/${id}`
            });
        }

        const where = { id };
        if (rol_usuario !== 'SuperAdministrador') {
            where.id_empresa = id_empresa;
        }

        const cliente = await Clientes.findOne({ where });
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
        const { id_empresa, rol_usuario } = req.user;

        // Vendedor no puede restaurar
        if (rol_usuario === 'Vendedor') {
            return ApiResponse.error(res, {
                error: 'No tienes permisos para restaurar clientes',
                status: 403,
                route: `${this.routes}/${id}/restore`
            });
        }

        const where = { id };
        if (rol_usuario !== 'SuperAdministrador') {
            where.id_empresa = id_empresa;
        }

        const cliente = await Clientes.findOne({
            where,
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
        const { id_empresa, rol_usuario } = req.user;

        // Vendedor no puede eliminar definitivamente
        if (rol_usuario === 'Vendedor') {
            return ApiResponse.error(res, {
                error: 'No tienes permisos para eliminar clientes definitivamente',
                status: 403,
                route: `${this.routes}/${id}/force`
            });
        }

        const where = { id };
        if (rol_usuario !== 'SuperAdministrador') {
            where.id_empresa = id_empresa;
        }

        const cliente = await Clientes.findOne({
            where,
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
