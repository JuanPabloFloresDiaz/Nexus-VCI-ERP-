const { Empresas, sequelize } = require('../models');
const catchErrors = require('../utils/tryCatch');
const ApiResponse = require('../utils/apiResponse');
const getPaginatedQuery = require('../utils/getPaginatedQuery');
const { Op } = require('sequelize');

class EmpresasController {
    static routes = '/empresas';

    // Listar todas las empresas (Admin/SuperAdmin)
    static index = catchErrors(async (req, res) => {
        const { query, limit, offset, order } = getPaginatedQuery(req.query);
        const { search } = req.query;

        const where = { ...query };

        if (search) {
            where[Op.or] = [
                { nombre_empresa: { [Op.like]: `%${search}%` } },
                { nit_empresa: { [Op.like]: `%${search}%` } },
                { correo_empresa: { [Op.like]: `%${search}%` } }
            ];
        }

        const data = await Empresas.findAndCountAll({
            where,
            limit,
            offset,
            order
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Listado de empresas obtenido correctamente',
            status: 200,
            route: this.routes
        });
    });

    // Obtener una empresa por ID
    static getById = catchErrors(async (req, res) => {
        const { id } = req.params;
        const empresa = await Empresas.findByPk(id);

        if (!empresa) {
            return ApiResponse.error(res, {
                error: 'Empresa no encontrada',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        return ApiResponse.success(res, {
            data: empresa,
            message: 'Empresa obtenida correctamente',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    // Crear una nueva empresa (Generalmente usado por SuperAdmin o proceso manual)
    static store = catchErrors(async (req, res) => {
        const body = req.body;

        const nuevaEmpresa = await Empresas.create(body);

        return ApiResponse.success(res, {
            data: nuevaEmpresa,
            message: 'Empresa creada exitosamente',
            status: 201,
            route: this.routes
        });
    });

    // Actualizar una empresa
    static update = catchErrors(async (req, res) => {
        const { id } = req.params;
        const dataToUpdate = req.body;

        const empresa = await Empresas.findByPk(id);
        if (!empresa) {
            return ApiResponse.error(res, {
                error: 'Empresa no encontrada',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        await empresa.update(dataToUpdate);

        return ApiResponse.success(res, {
            data: empresa,
            message: 'Empresa actualizada exitosamente',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    // Eliminar (Soft Delete) una empresa
    static destroy = catchErrors(async (req, res) => {
        const { id } = req.params;
        const empresa = await Empresas.findByPk(id);

        if (!empresa) {
            return ApiResponse.error(res, {
                error: 'Empresa no encontrada',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        await empresa.destroy();

        return ApiResponse.success(res, {
            data: null,
            message: 'Empresa eliminada correctamente',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    // Obtener perfil de la empresa (para el usuario logueado)
    static getProfile = catchErrors(async (req, res) => {
        const { id_empresa } = req.user;

        if (!id_empresa) {
            return ApiResponse.error(res, {
                error: 'Usuario no asociado a una empresa',
                status: 400,
                route: `${this.routes}/profile`
            });
        }

        const empresa = await Empresas.findByPk(id_empresa);

        if (!empresa) {
            return ApiResponse.error(res, {
                error: 'Empresa no encontrada',
                status: 404,
                route: `${this.routes}/profile`
            });
        }

        return ApiResponse.success(res, {
            data: empresa,
            message: 'Perfil de empresa obtenido correctamente',
            status: 200,
            route: `${this.routes}/profile`
        });
    });

    // Actualizar perfil de la empresa (para el usuario logueado - Admin)
    static updateProfile = catchErrors(async (req, res) => {
        const { id_empresa } = req.user;
        const dataToUpdate = req.body;

        if (!id_empresa) {
             return ApiResponse.error(res, {
                error: 'Usuario no asociado a una empresa',
                status: 400,
                route: `${this.routes}/profile`
            });
        }

        const empresa = await Empresas.findByPk(id_empresa);

        if (!empresa) {
            return ApiResponse.error(res, {
                error: 'Empresa no encontrada',
                status: 404,
                route: `${this.routes}/profile`
            });
        }

        await empresa.update(dataToUpdate);

        return ApiResponse.success(res, {
            data: empresa,
            message: 'Perfil de empresa actualizado exitosamente',
            status: 200,
            route: `${this.routes}/profile`
        });
    });

    // Listar empresas para select (SuperAdmin)
    static listSelect = catchErrors(async (req, res) => {
        const empresas = await Empresas.findAll({
            attributes: ['id', 'nombre_empresa', 'logo_url']
        });

        return ApiResponse.success(res, {
            data: empresas,
            message: 'Lista de empresas obtenida correctamente',
            status: 200,
            route: `${this.routes}/select`
        });
    });

    // Listar empresas eliminadas (Papelera)
    static trashed = catchErrors(async (req, res) => {
        const { query, limit, offset, order } = getPaginatedQuery(req.query);
        const { search } = req.query;

        const where = {
            ...query,
            deleted_at: { [Op.not]: null }
        };

        if (search) {
            where[Op.or] = [
                { nombre_empresa: { [Op.like]: `%${search}%` } },
                { nit_empresa: { [Op.like]: `%${search}%` } },
                { correo_empresa: { [Op.like]: `%${search}%` } }
            ];
        }

        const data = await Empresas.findAndCountAll({
            where,
            limit,
            offset,
            order,
            paranoid: false // Incluir eliminados
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Papelera de empresas obtenida correctamente',
            status: 200,
            route: `${this.routes}/trashed`
        });
    });

    // Restaurar empresa
    static restore = catchErrors(async (req, res) => {
        const { id } = req.params;

        const empresa = await Empresas.findByPk(id, { paranoid: false });

        if (!empresa) {
            return ApiResponse.error(res, {
                error: 'Empresa no encontrada',
                status: 404,
                route: `${this.routes}/${id}/restore`
            });
        }

        await empresa.restore();

        return ApiResponse.success(res, {
            data: empresa,
            message: 'Empresa restaurada correctamente',
            status: 200,
            route: `${this.routes}/${id}/restore`
        });
    });

    // Eliminar definitivamente (Force Delete)
    static destroyPermanent = catchErrors(async (req, res) => {
        const { id } = req.params;
        const empresa = await Empresas.findByPk(id, { paranoid: false });

        if (!empresa) {
            return ApiResponse.error(res, {
                error: 'Empresa no encontrada',
                status: 404,
                route: `${this.routes}/${id}/force`
            });
        }

        await empresa.destroy({ force: true });

        return ApiResponse.success(res, {
            data: null,
            message: 'Empresa eliminada permanentemente',
            status: 200,
            route: `${this.routes}/${id}/force`
        });
    });
}

module.exports = EmpresasController;
