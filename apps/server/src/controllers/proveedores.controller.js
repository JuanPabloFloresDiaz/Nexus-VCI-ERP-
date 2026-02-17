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
                { nombre_proveedor: { [Op.like]: `%${search}%` } },
                { contacto_nombre: { [Op.like]: `%${search}%` } },
                { correo_proveedor: { [Op.like]: `%${search}%` } }
            ];
        }

        const data = await Proveedores.findAndCountAll({
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
            message: 'Listado de proveedores obtenido correctamente',
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
                { nombre_proveedor: { [Op.like]: `%${search}%` } },
                { contacto_nombre: { [Op.like]: `%${search}%` } }
            ];
        }

        const data = await Proveedores.findAndCountAll({
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
            message: 'Papelera de proveedores obtenida correctamente',
            status: 200,
            route: `${this.routes}/trashed`
        });
    });

    static getById = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa, rol_usuario } = req.user;

        const where = { id };
        if (rol_usuario !== 'SuperAdministrador') {
            where.id_empresa = id_empresa;
        }

        const proveedor = await Proveedores.findOne({
            where,
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
        const { nombre_proveedor, contacto_nombre, telefono_proveedor, correo_proveedor, nit_dui_proveedor, direccion_proveedor, dias_credito, id_empresa: bodyIdEmpresa } = req.body;
        const { id_empresa: userIdEmpresa, rol_usuario } = req.user;

        if (rol_usuario === 'Vendedor') {
            return ApiResponse.error(res, {
                error: 'No tienes permisos para crear proveedores',
                status: 403,
                route: this.routes
            });
        }

        // Determinar ID empresa
        let targetIdEmpresa = userIdEmpresa;
        if (rol_usuario === 'SuperAdministrador' && bodyIdEmpresa) {
            targetIdEmpresa = bodyIdEmpresa;
        }

        // Check for existing provider name in same company (optional constraint but good practice)
        const existing = await Proveedores.findOne({ where: { nombre_proveedor, id_empresa: targetIdEmpresa } });
        if (existing) {
            return ApiResponse.error(res, {
                error: 'Ya existe un proveedor con este nombre en la empresa',
                status: 400,
                route: this.routes
            });
        }

        const newProveedor = await Proveedores.create({
            id_empresa: targetIdEmpresa,
            nombre_proveedor,
            contacto_nombre,
            telefono_proveedor,
            correo_proveedor,
            nit_dui_proveedor,
            direccion_proveedor,
            dias_credito
        });

        return ApiResponse.success(res, {
            data: newProveedor,
            message: 'Proveedor creado exitosamente',
            status: 201,
            route: this.routes
        });
    });

    static bulkStore = catchErrors(async (req, res) => {
        const { rol_usuario, id_empresa: userIdEmpresa } = req.user;

        if (rol_usuario === 'Vendedor') {
            return ApiResponse.error(res, {
                error: 'No tienes permisos para cargar proveedores masivamente',
                status: 403,
                route: `${this.routes}/bulk`
            });
        }

        const items = req.body.map(item => {
            // Si es SuperAdmin y viene id_empresa, usarlo, sino usar el del token (o null si es superadmin sin empresa, cuidado aqui)
            // Asumiendo LOGICA DE NEGOCIO: Si es superadmin, DEBE venir el id_empresa en el excel o usar un default?
            // La logica usada en Clientes fue: Si es superadmin usa el del body, si no, usa el del user.
            // Aqui el item ya trae id_empresa si es superadmin (segun el modal que haremos).

            let targetIdEmpresa = userIdEmpresa;
            if (rol_usuario === 'SuperAdministrador' && item.id_empresa) {
                targetIdEmpresa = item.id_empresa;
            }

            return { ...item, id_empresa: targetIdEmpresa };
        });

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
        const { nombre_proveedor, contacto_nombre, telefono_proveedor, correo_proveedor, nit_dui_proveedor, direccion_proveedor, dias_credito, id_empresa: bodyIdEmpresa } = req.body;
        const { id_empresa: userIdEmpresa, rol_usuario } = req.user;

        if (rol_usuario === 'Vendedor') {
            return ApiResponse.error(res, {
                error: 'No tienes permisos para actualizar proveedores',
                status: 403,
                route: `${this.routes}/${id}`
            });
        }

        const where = { id };
        if (rol_usuario !== 'SuperAdministrador') {
            where.id_empresa = userIdEmpresa;
        }

        const proveedor = await Proveedores.findOne({ where });
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
                    id_empresa: proveedor.id_empresa,
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

        // SuperAdmin can change company
        if (rol_usuario === 'SuperAdministrador' && bodyIdEmpresa) {
            proveedor.id_empresa = bodyIdEmpresa;
        }

        await proveedor.update({
            nombre_proveedor,
            contacto_nombre,
            telefono_proveedor,
            correo_proveedor,
            nit_dui_proveedor,
            direccion_proveedor,
            dias_credito
            // id_empresa is updated via instance modification above if applicable
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
        const { id_empresa, rol_usuario } = req.user;

        if (rol_usuario === 'Vendedor') {
            return ApiResponse.error(res, {
                error: 'No tienes permisos para eliminar proveedores',
                status: 403,
                route: `${this.routes}/${id}`
            });
        }

        const where = { id };
        if (rol_usuario !== 'SuperAdministrador') {
            where.id_empresa = id_empresa;
        }

        const proveedor = await Proveedores.findOne({ where });

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
        const { id_empresa, rol_usuario } = req.user;

        if (rol_usuario === 'Vendedor') {
            return ApiResponse.error(res, {
                error: 'No tienes permisos para restaurar proveedores',
                status: 403,
                route: `${this.routes}/${id}/restore`
            });
        }

        const where = { id };
        if (rol_usuario !== 'SuperAdministrador') {
            where.id_empresa = id_empresa;
        }

        const proveedor = await Proveedores.findOne({
            where,
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
        const { id_empresa, rol_usuario } = req.user;

        if (rol_usuario === 'Vendedor') {
            return ApiResponse.error(res, {
                error: 'No tienes permisos para eliminar definitivamente proveedores',
                status: 403,
                route: `${this.routes}/${id}/force`
            });
        }

        const where = { id };
        if (rol_usuario !== 'SuperAdministrador') {
            where.id_empresa = id_empresa;
        }

        const proveedor = await Proveedores.findOne({
            where,
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
