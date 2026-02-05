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
        const { id_empresa } = req.user;

        const where = { ...query, id_empresa };

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
            attributes: { exclude: ['clave_acceso'] }
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
        const { id_empresa } = req.user;

        const where = {
            ...query,
            id_empresa,
            deleted_at: { [Op.not]: null }
        };

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
            attributes: { exclude: ['clave_acceso'] }
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
        const { id_empresa } = req.user;
        const data = await Usuarios.findAll({
            attributes: ['id', 'nombre_usuario'],
            where: { estado_usuario: true, id_empresa } // Usually 'all' for selects implies active users
        });

        return ApiResponse.success(res, {
            data,
            message: 'Listado rápido de usuarios obtenido correctamente',
            status: 200,
            route: `${this.routes}/all`
        });
    });

    static store = catchErrors(async (req, res) => {
        const { nombre_usuario, correo_electronico, clave_acceso, rol_usuario } = req.body;
        const { id_empresa } = req.user;

        // Check for existing email matches
        const existingUser = await Usuarios.findOne({ where: { correo_electronico, id_empresa } });
        if (existingUser) {
            return ApiResponse.error(res, {
                error: 'El correo electrónico ya está registrado',
                status: 400,
                route: this.routes
            });
        }

        console.log('🔹 Intentando registrar usuario:', correo_electronico);

        console.log('🔹 Encriptando contraseña...');
        const hashedPassword = await encryptPassword(clave_acceso);
        console.log('✅ Contraseña encriptada.');

        const newUser = await Usuarios.create({
            id_empresa,
            nombre_usuario,
            correo_electronico,
            clave_acceso: hashedPassword,
            rol_usuario
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
        const { nombre_usuario, correo_electronico, rol_usuario, estado_usuario } = req.body;
        const { id_empresa } = req.user;

        const user = await Usuarios.findOne({ where: { id, id_empresa } });
        if (!user) {
            return ApiResponse.error(res, {
                error: 'Usuario no encontrado',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        if (correo_electronico && correo_electronico !== user.correo_electronico) {
            const existingEmail = await Usuarios.findOne({
                where: {
                    correo_electronico,
                    id_empresa,
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
        const { id_empresa } = req.user;

        const user = await Usuarios.findOne({ where: { id, id_empresa } });
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
        const { id_empresa } = req.user;

        // paranoid: false is needed to find soft-deleted records
        const user = await Usuarios.findOne({
            where: { id, id_empresa },
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
        const { id_empresa } = req.user;

        const user = await Usuarios.findOne({
            where: { id, id_empresa },
            paranoid: false
        });
        if (!user) {
            return ApiResponse.error(res, {
                error: 'Usuario no encontrado',
                status: 404,
                route: `${this.routes}/${id}/force`
            });
        }

        if (user.foto_perfil_url) {
            const filename = user.foto_perfil_url.split('/').pop();
            await StorageController.deleteFileInternal(filename);
        }

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
