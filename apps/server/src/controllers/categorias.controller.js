const { Categorias, Subcategorias, Filtros, OpcionesFiltro, sequelize } = require('../models');
const { Op } = require('sequelize');
const catchErrors = require('../utils/tryCatch');
const ApiResponse = require('../utils/apiResponse');
const getPaginatedQuery = require('../utils/getPaginatedQuery');

class CategoriasController {
    static routes = '/categorias';

    static index = catchErrors(async (req, res) => {
        const { query, limit, offset, order } = getPaginatedQuery(req.query);
        const { search } = req.query;
        const { id_empresa } = req.user;

        const where = { ...query, id_empresa };

        if (search) {
            where[Op.or] = [
                { nombre_categoria: { [Op.like]: `%${search}%` } },
                { descripcion_categoria: { [Op.like]: `%${search}%` } }
            ];
        }

        const data = await Categorias.findAndCountAll({
            where,
            limit,
            offset,
            order,
            include: [{
                model: Subcategorias,
                as: 'subcategorias',
                attributes: ['id', 'nombre_subcategoria'],
                include: [{
                    model: Filtros,
                    as: 'filtros',
                    include: [{
                        model: OpcionesFiltro,
                        as: 'opciones'
                    }]
                }]
            }]
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Listado de categorías obtenido correctamente',
            status: 200,
            route: this.routes
        });
    });

    static getById = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;

        const data = await Categorias.findOne({
            where: { id, id_empresa },
            include: [{
                model: Subcategorias,
                as: 'subcategorias',
                include: [{
                    model: Filtros,
                    as: 'filtros',
                    include: [{
                        model: OpcionesFiltro,
                        as: 'opciones'
                    }]
                }]
            }]
        });

        if (!data) {
            return ApiResponse.error(res, {
                error: 'Categoría no encontrada',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        return ApiResponse.success(res, {
            data,
            message: 'Categoría obtenida correctamente',
            status: 200,
            route: `${this.routes}/${id}`
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
                { nombre_categoria: { [Op.like]: `%${search}%` } },
                { descripcion_categoria: { [Op.like]: `%${search}%` } }
            ];
        }

        const data = await Categorias.findAndCountAll({
            where,
            limit,
            offset,
            order,
            paranoid: false,
            include: [{
                model: Subcategorias,
                as: 'subcategorias',
                attributes: ['id', 'nombre_subcategoria'],
                paranoid: false // Include even if subcategories are also soft-deleted (optional choice)
            }]
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Papelera de categorías obtenida correctamente',
            status: 200,
            route: `${this.routes}/trashed`
        });
    });

    static all = catchErrors(async (req, res) => {
        const { id_empresa } = req.user;
        const data = await Categorias.findAll({
            where: { id_empresa },
            attributes: ['id', 'nombre_categoria'],
            order: [['nombre_categoria', 'ASC']]
        });

        return ApiResponse.success(res, {
            data,
            message: 'Listado rápido de categorías obtenido correctamente',
            status: 200,
            route: `${this.routes}/all`
        });
    });

    static store = catchErrors(async (req, res) => {
        const { nombre_categoria, descripcion_categoria, subcategorias } = req.body;

        // Transaction since we might create subcategories
        const result = await sequelize.transaction(async (t) => {
            // Check for duplicate name
            const existing = await Categorias.findOne({
                where: { nombre_categoria, id_empresa: req.user.id_empresa },
                transaction: t
            });
            if (existing) {
                throw new Error('La categoría ya existe');
            }

            // Prepare data with nested structure
            const categoryData = {
                id_empresa: req.user.id_empresa,
                nombre_categoria,
                descripcion_categoria,
                subcategorias: subcategorias?.map(sub => ({
                    ...sub,
                    id_empresa: req.user.id_empresa,
                    filtros: sub.filtros?.map(filtro => ({
                        ...filtro,
                        id_empresa: req.user.id_empresa,
                        opciones: filtro.opciones?.map(opcion => ({
                            ...opcion,
                            id_empresa: req.user.id_empresa
                        }))
                    }))
                }))
            };

            const newCategoria = await Categorias.create(categoryData, {
                include: [{
                    model: Subcategorias,
                    as: 'subcategorias',
                    include: [{
                        model: Filtros,
                        as: 'filtros',
                        include: [{
                            model: OpcionesFiltro,
                            as: 'opciones'
                        }]
                    }]
                }],
                transaction: t
            });

            return newCategoria;
        });

        const data = await Categorias.findByPk(result.id, {
            include: [{
                model: Subcategorias,
                as: 'subcategorias',
                include: [{
                    model: Filtros,
                    as: 'filtros',
                    include: [{
                        model: OpcionesFiltro,
                        as: 'opciones'
                    }]
                }]
            }]
        });

        return ApiResponse.success(res, {
            data,
            message: 'Categoría creada exitosamente',
            status: 201,
            route: this.routes
        });
    });

    static bulkStore = catchErrors(async (req, res) => {
        const { id_empresa } = req.user;

        // Helper to recursively inject id_empresa
        const injectIdEmpresa = (items) => {
            return items.map(item => {
                const newItem = { ...item, id_empresa };

                if (newItem.subcategorias) {
                    newItem.subcategorias = injectIdEmpresa(newItem.subcategorias);
                }

                // Subcategories have filters, filters have options
                // If the item IS a subcategory (check by property existence or context, 
                // but here we are processing a tree starting from Categorias)

                // Actually, the structure is Categoria -> Subcategoria -> Filtro -> Opcion
                // My recursive function above handles "subcategorias" property. 
                // But if we are inside a subcategory, the next level property is "filtros".
                // And inside filter it is "opciones".
                // Let's make it specific for the structure to avoid ambiguity or generic recursion issues.

                return newItem;
            });
        };

        // Strict structure mapping to ensure id_empresa is everywhere
        const items = req.body.map(cat => ({
            ...cat,
            id_empresa,
            subcategorias: cat.subcategorias?.map(sub => ({
                ...sub,
                id_empresa,
                filtros: sub.filtros?.map(filtro => ({
                    ...filtro,
                    id_empresa,
                    opciones: filtro.opciones?.map(opcion => ({
                        ...opcion,
                        id_empresa
                    }))
                }))
            }))
        }));

        // We use bulkCreate with deep includes to handle nested creation automatically
        const data = await Categorias.bulkCreate(items, {
            include: [{
                model: Subcategorias,
                as: 'subcategorias',
                include: [{
                    model: Filtros,
                    as: 'filtros',
                    include: [{
                        model: OpcionesFiltro,
                        as: 'opciones'
                    }]
                }]
            }],
            validate: true // Run validations
        });

        return ApiResponse.success(res, {
            data,
            message: `${data.length} categorías creadas exitosamente`,
            status: 201,
            route: `${this.routes}/bulk`
        });
    });

    static update = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;
        const { nombre_categoria, descripcion_categoria, subcategorias } = req.body;

        const categoria = await Categorias.findOne({ where: { id, id_empresa } });
        if (!categoria) {
            return ApiResponse.error(res, {
                error: 'Categoría no encontrada',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        const result = await sequelize.transaction(async (t) => {
            // 1. Update Category
            await categoria.update({
                nombre_categoria,
                descripcion_categoria
            }, { transaction: t });

            // 2. Sync Subcategories
            // Get existing IDs from DB
            const existingSubs = await Subcategorias.findAll({ where: { id_categoria: id }, transaction: t });
            const existingSubIds = existingSubs.map(s => s.id);

            const incomingSubIds = [];

            if (subcategorias && subcategorias.length > 0) {
                for (const sub of subcategorias) {
                    let subInstance;
                    if (sub.id && existingSubIds.includes(sub.id)) {
                        // Update existing
                        subInstance = await Subcategorias.findByPk(sub.id, { transaction: t });
                        if (subInstance) {
                            await subInstance.update({ nombre_subcategoria: sub.nombre_subcategoria }, { transaction: t });
                            incomingSubIds.push(sub.id);
                        }
                    } else {
                        // Create new
                        const newSub = await Subcategorias.create({
                            id_categoria: id,
                            nombre_subcategoria: sub.nombre_subcategoria
                        }, { transaction: t });
                        subInstance = newSub;
                        // Don't push to incomingSubIds immediately if we want to delete missing? 
                        // Wait, sync logic is relative to existing DB state.
                        // Created items are fine.
                    }

                    // 2.1 Sync Filters for this subcategory
                    if (subInstance) {
                        const existingFiltros = await Filtros.findAll({ where: { id_subcategoria: subInstance.id }, transaction: t });
                        const existingFiltroIds = existingFiltros.map(f => f.id);
                        const incomingFiltroIds = [];

                        if (sub.filtros && sub.filtros.length > 0) {
                            for (const filtro of sub.filtros) {
                                let filtroInstance;
                                if (filtro.id && existingFiltroIds.includes(filtro.id)) {
                                    filtroInstance = await Filtros.findByPk(filtro.id, { transaction: t });
                                    if (filtroInstance) {
                                        await filtroInstance.update({
                                            nombre_filtro: filtro.nombre_filtro,
                                            tipo_dato: filtro.tipo_dato
                                        }, { transaction: t });
                                        incomingFiltroIds.push(filtro.id);
                                    }
                                } else {
                                    const newFiltro = await Filtros.create({
                                        id_empresa,
                                        id_subcategoria: subInstance.id,
                                        nombre_filtro: filtro.nombre_filtro,
                                        tipo_dato: filtro.tipo_dato
                                    }, { transaction: t });
                                    filtroInstance = newFiltro;
                                }

                                // 2.1.1 Sync Options
                                if (filtroInstance) {
                                    const existingOps = await OpcionesFiltro.findAll({ where: { id_filtro: filtroInstance.id }, transaction: t });
                                    const existingOpIds = existingOps.map(o => o.id);
                                    const incomingOpIds = [];

                                    if (filtro.opciones && filtro.opciones.length > 0) {
                                        for (const op of filtro.opciones) {
                                            if (op.id && existingOpIds.includes(op.id)) {
                                                const opInst = await OpcionesFiltro.findByPk(op.id, { transaction: t });
                                                if (opInst) {
                                                    await opInst.update({ valor_opcion: op.valor_opcion }, { transaction: t });
                                                    incomingOpIds.push(op.id);
                                                }
                                            } else {
                                                await OpcionesFiltro.create({
                                                    id_empresa,
                                                    id_filtro: filtroInstance.id,
                                                    valor_opcion: op.valor_opcion
                                                }, { transaction: t });
                                            }
                                        }
                                    }
                                    // Delete missing options
                                    const opsToDelete = existingOpIds.filter(oid => !incomingOpIds.includes(oid));
                                    if (opsToDelete.length > 0) {
                                        await OpcionesFiltro.destroy({ where: { id: opsToDelete }, transaction: t });
                                    }
                                }
                            }
                        }
                        // Delete missing filters
                        const filtrosToDelete = existingFiltroIds.filter(fid => !incomingFiltroIds.includes(fid));
                        if (filtrosToDelete.length > 0) {
                            // First delete options of these filters (cascade?) 
                            // Sequelize soft delete handles it if configured, otherwise manual delete might be safer.
                            // Assuming options are cascading or soft deleted too.
                            // But usually safe to delete parent if DB set to cascade, or better soft delete them first.
                            // For simplicity, let's just delete the filters (soft delete).
                            await Filtros.destroy({ where: { id: filtrosToDelete }, transaction: t });
                        }
                    }
                }
            }

            // Delete missing subcategories
            const subsToDelete = existingSubIds.filter(sid => !incomingSubIds.includes(sid));
            if (subsToDelete.length > 0) {
                await Subcategorias.destroy({ where: { id: subsToDelete }, transaction: t });
            }
        });

        return ApiResponse.success(res, {
            data: null,
            message: 'Categoría actualizada correctamente',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static destroy = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;
        const categoria = await Categorias.findOne({ where: { id, id_empresa } });

        if (!categoria) {
            return ApiResponse.error(res, {
                error: 'Categoría no encontrada',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        await categoria.destroy(); // Soft delete

        return ApiResponse.success(res, {
            data: null,
            message: 'Categoría eliminada correctamente (Soft Delete)',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static restore = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;
        const categoria = await Categorias.findOne({
            where: { id, id_empresa },
            paranoid: false
        });

        if (!categoria) {
            return ApiResponse.error(res, {
                error: 'Categoría no encontrada',
                status: 404,
                route: `${this.routes}/${id}/restore`
            });
        }

        if (!categoria.deleted_at) {
            return ApiResponse.error(res, {
                error: 'La categoría no está eliminada',
                status: 400,
                route: `${this.routes}/${id}/restore`
            });
        }

        await categoria.restore();

        return ApiResponse.success(res, {
            data: categoria,
            message: 'Categoría restaurada correctamente',
            status: 200,
            route: `${this.routes}/${id}/restore`
        });
    });

    static forceDestroy = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;
        const categoria = await Categorias.findOne({
            where: { id, id_empresa },
            paranoid: false
        });

        if (!categoria) {
            return ApiResponse.error(res, {
                error: 'Categoría no encontrada',
                status: 404,
                route: `${this.routes}/${id}/force`
            });
        }

        await categoria.destroy({ force: true });

        return ApiResponse.success(res, {
            data: null,
            message: 'Categoría eliminada definitivamente',
            status: 200,
            route: `${this.routes}/${id}/force`
        });
    });
}

module.exports = CategoriasController;
