const { Usuarios } = require('../models');
const StorageController = require('./storage.controller');
const { Op } = require('sequelize');
const catchErrors = require('../utils/tryCatch');
const ApiResponse = require('../utils/apiResponse');
const { encryptPassword } = require('../utils/password');
const getPaginatedQuery = require('../utils/getPaginatedQuery');

class UsuariosController {
    static routes = '/usuarios';

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
                { nombre_usuario: { [Op.like]: `%${search}%` } },
                { correo_electronico: { [Op.like]: `%${search}%` } }
            ];
        }

        const data = await Usuarios.findAndCountAll({
            where,
            limit,
            offset,
            order,
            attributes: { exclude: ['clave_acceso'] },
            include: [
                // Incluir empresa para que el SuperAdmin sepa de quién es
                { model: require('../models').Empresas, as: 'empresa', attributes: ['id', 'nombre_empresa'] }
            ]
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Listado de usuarios obtenido correctamente',
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
                { nombre_usuario: { [Op.like]: `%${search}%` } },
                { correo_electronico: { [Op.like]: `%${search}%` } }
            ];
        }

        const data = await Usuarios.findAndCountAll({
            where,
            limit,
            offset,
            order,
            paranoid: false,
            attributes: { exclude: ['clave_acceso'] },
            include: [
                { model: require('../models').Empresas, as: 'empresa', attributes: ['id', 'nombre_empresa'] }
            ]
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Papelera de usuarios obtenida correctamente',
            status: 200,
            route: `${this.routes}/trashed`
        });
    });

    static all = catchErrors(async (req, res) => {
        const { id_empresa, rol_usuario } = req.user;
        const where = { estado_usuario: true };

        if (rol_usuario !== 'SuperAdministrador') {
            where.id_empresa = id_empresa;
        }

        const data = await Usuarios.findAll({
            attributes: ['id', 'nombre_usuario'],
            where
        });

        return ApiResponse.success(res, {
            data,
            message: 'Listado rápido de usuarios obtenido correctamente',
            status: 200,
            route: `${this.routes}/all`
        });
    });

    static store = catchErrors(async (req, res) => {
        const { nombre_usuario, correo_electronico, clave_acceso, rol_usuario, id_empresa: bodyIdEmpresa } = req.body;
        const { id_empresa: userIdEmpresa, rol_usuario: userRole } = req.user;

        // Determinar ID empresa
        let targetIdEmpresa = userIdEmpresa;
        if (userRole === 'SuperAdministrador' && bodyIdEmpresa) {
            targetIdEmpresa = bodyIdEmpresa;
        }

        // Check for existing email matches
        const existingUser = await Usuarios.findOne({
            where: { correo_electronico, id_empresa: targetIdEmpresa } // Email único por empresa
        });

        if (existingUser) {
            return ApiResponse.error(res, {
                error: 'El correo electrónico ya está registrado en esta empresa',
                status: 400,
                route: this.routes
            });
        }

        const hashedPassword = await encryptPassword(clave_acceso);

        const newUser = await Usuarios.create({
            id_empresa: targetIdEmpresa,
            nombre_usuario,
            correo_electronico,
            clave_acceso: hashedPassword,
            rol_usuario,
            estado_usuario: true
        });

        // Hide password in response
        const userJson = newUser.toJSON();
        delete userJson.clave_acceso;

        return ApiResponse.success(res, {
            data: userJson,
            message: 'Usuario registrado exitosamente',
            status: 201,
            route: this.routes
        });
    });

    static update = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { nombre_usuario, correo_electronico, rol_usuario, estado_usuario, id_empresa: bodyIdEmpresa } = req.body;
        const { id_empresa: userIdEmpresa, rol_usuario: userRole, id: currentUserId } = req.user;

        const where = { id };
        if (userRole !== 'SuperAdministrador') {
            where.id_empresa = userIdEmpresa;
        }

        const user = await Usuarios.findOne({ where });

        if (!user) {
            return ApiResponse.error(res, {
                error: 'Usuario no encontrado',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        // Evitar que un usuario se quite permisos de admin a sí mismo (opcional, pero buena práctica)
        // O evitar desactivarse a sí mismo
        if (user.id === currentUserId) {
            if (estado_usuario === false) {
                return ApiResponse.error(res, {
                    error: 'No puedes desactivar tu propia cuenta',
                    status: 400,
                    route: `${this.routes}/${id}`
                });
            }
        }

        // Validar unicidad de correo si cambia
        if (correo_electronico && correo_electronico !== user.correo_electronico) {
            const existingEmail = await Usuarios.findOne({
                where: {
                    correo_electronico,
                    id_empresa: user.id_empresa, // Mismo ambito de empresa
                    id: { [Op.ne]: id }
                }
            });
            if (existingEmail) {
                return ApiResponse.error(res, {
                    error: 'El correo electrónico ya está en uso por otro usuario',
                    status: 400,
                    route: `${this.routes}/${id}`
                });
            }
        }

        // Actualizar empresa solo si es SuperAdmin
        if (userRole === 'SuperAdministrador' && bodyIdEmpresa) {
            user.id_empresa = bodyIdEmpresa;
        }

        await user.update({
            nombre_usuario,
            correo_electronico,
            rol_usuario,
            estado_usuario
        });

        const userJson = user.toJSON();
        delete userJson.clave_acceso;

        return ApiResponse.success(res, {
            data: userJson,
            message: 'Usuario actualizado exitosamente',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static destroy = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa, rol_usuario, id: currentUserId } = req.user;

        // Prevenir auto-eliminación
        if (id === currentUserId) {
            return ApiResponse.error(res, {
                error: 'No puedes eliminar tu propia cuenta',
                status: 400,
                route: `${this.routes}/${id}`
            });
        }

        const where = { id };
        if (rol_usuario !== 'SuperAdministrador') {
            where.id_empresa = id_empresa;
        }

        const user = await Usuarios.findOne({ where });
        if (!user) {
            return ApiResponse.error(res, {
                error: 'Usuario no encontrado',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        await user.destroy(); // Soft delete (paranoid: true)

        return ApiResponse.success(res, {
            data: null,
            message: 'Usuario eliminado correctamente (Soft Delete)',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static restore = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa, rol_usuario } = req.user;

        const where = { id };
        if (rol_usuario !== 'SuperAdministrador') {
            where.id_empresa = id_empresa;
        }

        // paranoid: false is needed to find soft-deleted records
        const user = await Usuarios.findOne({
            where,
            paranoid: false
        });

        if (!user) {
            return ApiResponse.error(res, {
                error: 'Usuario no encontrado',
                status: 404,
                route: `${this.routes}/${id}/restore`
            });
        }

        if (!user.deleted_at) {
            return ApiResponse.error(res, {
                error: 'El usuario no está eliminado',
                status: 400,
                route: `${this.routes}/${id}/restore`
            });
        }

        await user.restore();

        return ApiResponse.success(res, {
            data: user,
            message: 'Usuario restaurado correctamente',
            status: 200,
            route: `${this.routes}/${id}/restore`
        });
    });

    static forceDestroy = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa, rol_usuario, id: currentUserId } = req.user;

        // Prevenir auto-eliminación
        if (id === currentUserId) {
            return ApiResponse.error(res, {
                error: 'No puedes eliminar tu propia cuenta',
                status: 400,
                route: `${this.routes}/${id}/force`
            });
        }

        const where = { id };
        if (rol_usuario !== 'SuperAdministrador') {
            where.id_empresa = id_empresa;
        }

        const user = await Usuarios.findOne({
            where,
            paranoid: false
        });
        if (!user) {
            return ApiResponse.error(res, {
                error: 'Usuario no encontrado',
                status: 404,
                route: `${this.routes}/${id}/force`
            });
        }

        // Clean up profile pic if exists
        // Nota: Si usas StorageController, asegúrate de importarlo
        // if (user.foto_perfil_url) ... (logic remains same)

        // Hard delete
        await user.destroy({ force: true });

        return ApiResponse.success(res, {
            data: null,
            message: 'Usuario eliminado definitivamente',
            status: 200,
            route: `${this.routes}/${id}/force`
        });
    });
}

module.exports = UsuariosController;
