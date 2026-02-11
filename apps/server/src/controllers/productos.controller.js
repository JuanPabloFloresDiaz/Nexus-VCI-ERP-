const { Productos, ProductoDetallesFiltros, Subcategorias, OpcionesFiltro, Filtros, sequelize } = require('../models');
const StorageController = require('./storage.controller');
const { Op } = require('sequelize');
const catchErrors = require('../utils/tryCatch');
const ApiResponse = require('../utils/apiResponse');
const getPaginatedQuery = require('../utils/getPaginatedQuery');

class ProductosController {
    static routes = '/productos';

    static index = catchErrors(async (req, res) => {
        const { query, limit, offset, order } = getPaginatedQuery(req.query);
        const { search, id_categoria, min_price, max_price } = req.query;
        const { id_empresa } = req.user;

        // Remove non-column filters from query object to avoid SQL errors
        // "query" contains everything not extracted by getPaginatedQuery (page, limit, sort, order, search)
        // so it includes id_categoria, min_price, max_price which are NOT columns on Productos
        const {
            id_categoria: _cat,
            min_price: _min,
            max_price: _max,
            ...cleanQuery
        } = query;

        const where = { ...cleanQuery, id_empresa };

        if (search) {
            where[Op.or] = [
                { nombre_producto: { [Op.like]: `%${search}%` } },
                { descripcion_producto: { [Op.like]: `%${search}%` } }
            ];
        }

        // Filter by Price Range
        if (min_price !== undefined || max_price !== undefined) {
            where.precio_unitario = {};
            if (min_price) where.precio_unitario[Op.gte] = min_price;
            if (max_price) where.precio_unitario[Op.lte] = max_price;
        }

        // Filter by Category (via Subcategory)
        const subcategoriaWhere = {};
        if (id_categoria) {
            subcategoriaWhere.id_categoria = id_categoria;
        }

        const data = await Productos.findAndCountAll({
            where,
            limit,
            offset,
            order,
            distinct: true,
            include: [
                {
                    model: Subcategorias,
                    as: 'subcategoria',
                    attributes: ['id', 'nombre_subcategoria', 'id_categoria'],
                    where: subcategoriaWhere // Apply category filter here
                },
                {
                    model: ProductoDetallesFiltros,
                    as: 'detalles_filtros',
                    include: [{
                        model: OpcionesFiltro,
                        as: 'opcion_filtro',
                        include: [{
                            model: Filtros,
                            as: 'filtro'
                        }]
                    }]
                }
            ]
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Listado de productos obtenido correctamente',
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
                { nombre_producto: { [Op.like]: `%${search}%` } },
                { descripcion_producto: { [Op.like]: `%${search}%` } }
            ];
        }

        const data = await Productos.findAndCountAll({
            where,
            limit,
            offset,
            order,
            distinct: true,
            paranoid: false,
            include: [{
                model: Subcategorias,
                as: 'subcategoria',
                attributes: ['id', 'nombre_subcategoria'],
                paranoid: false
            }]
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Papelera de productos obtenida correctamente',
            status: 200,
            route: `${this.routes}/trashed`
        });
    });

    static getById = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;

        const producto = await Productos.findOne({
            where: { id, id_empresa },
            include: [
                {
                    model: Subcategorias,
                    as: 'subcategoria',
                    attributes: ['id', 'nombre_subcategoria', 'id_categoria']
                },
                {
                    model: ProductoDetallesFiltros,
                    as: 'detalles_filtros',
                    include: [{
                        model: OpcionesFiltro,
                        as: 'opcion_filtro',
                        include: [{
                            model: Filtros,
                            as: 'filtro'
                        }]
                    }]
                }
            ]
        });

        if (!producto) {
            return ApiResponse.error(res, {
                error: 'Producto no encontrado',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        return ApiResponse.success(res, {
            data: producto,
            message: 'Producto obtenido correctamente',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static store = catchErrors(async (req, res) => {
        const { id_subcategoria, nombre_producto, descripcion_producto, precio_unitario, costo_unitario, stock_actual, imagen_url, detalles } = req.body;

        const result = await sequelize.transaction(async (t) => {
            const newProducto = await Productos.create({
                id_empresa: req.user.id_empresa,
                id_subcategoria,
                id_usuario_gestor: req.user.id,
                nombre_producto,
                descripcion_producto,
                precio_unitario,
                costo_unitario,
                stock_actual,
                stock_inicial: stock_actual,
                imagen_url
            }, { transaction: t });

            if (detalles && detalles.length > 0) {
                const detallesData = detalles.map(d => ({
                    id_producto: newProducto.id,
                    id_opcion_filtro: d.id_opcion_filtro
                }));
                await ProductoDetallesFiltros.bulkCreate(detallesData, { transaction: t });
            }

            return newProducto;
        });

        return ApiResponse.success(res, {
            data: result,
            message: 'Producto creado exitosamente',
            status: 201,
            route: this.routes
        });
    });

    static bulkStore = catchErrors(async (req, res) => {
        // Items: Array of { ..., detalles: [{id_opcion_filtro}] }
        const items = req.body;

        // Not trivial to use bulkCreate with custom mapping for nested associations that need transforming
        // Strategy: Loop with transaction is safer for complex nested logic if automatic association mapping isn't perfectly clean 
        // Or properly format data.
        // For simplicity and correctness with the specific nested structure {id_producto, id_opcion_filtro}, 
        // let's iterate. Efficient enough for moderate bulk.

        const result = await sequelize.transaction(async (t) => {
            const createdProducts = [];
            for (const item of items) {
                const { detalles, ...prodData } = item;
                const newProd = await Productos.create({
                    ...prodData,
                    stock_inicial: prodData.stock_actual,
                    id_usuario_gestor: req.user.id,
                    id_empresa: req.user.id_empresa
                }, { transaction: t });

                if (detalles && detalles.length > 0) {
                    const detallesData = detalles.map(d => ({
                        id_producto: newProd.id,
                        id_opcion_filtro: d.id_opcion_filtro
                    }));
                    await ProductoDetallesFiltros.bulkCreate(detallesData, { transaction: t });
                }
                createdProducts.push(newProd);
            }
            return createdProducts;
        });

        return ApiResponse.success(res, {
            data: result,
            message: `${result.length} productos creados exitosamente`,
            status: 201,
            route: `${this.routes}/bulk`
        });
    });

    static update = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;
        const { id_subcategoria, nombre_producto, descripcion_producto, precio_unitario, costo_unitario, stock_actual, imagen_url, detalles } = req.body;

        const producto = await Productos.findOne({ where: { id, id_empresa } });
        if (!producto) {
            return ApiResponse.error(res, {
                error: 'Producto no encontrado',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        const result = await sequelize.transaction(async (t) => {
            // 1. Update Product Basic Info
            await producto.update({
                id_subcategoria, // Can change subcategory? If so, we must ensure integrity of details. For now assume yes.
                nombre_producto,
                descripcion_producto,
                precio_unitario,
                costo_unitario,
                stock_actual,
                imagen_url
            }, { transaction: t });

            // 2. Sync Details (Traits/Filters)
            // Simplest robust strategy: Delete all existing, re-create new.
            // Since ProductoDetallesFiltros is a simple link table without extra computed columns, this is efficient enough.

            if (detalles) {
                // Only sync if 'detalles' is present in body. Use null/undefined to skip (partial update) or empty array to clear.

                // Delete existing details for this product
                await ProductoDetallesFiltros.destroy({
                    where: { id_producto: id },
                    transaction: t
                });

                // Create new ones
                if (detalles.length > 0) {
                    const detallesData = detalles.map(d => ({
                        id_producto: id,
                        id_opcion_filtro: d.id_opcion_filtro // Expecting array of { id_opcion_filtro }
                    }));
                    await ProductoDetallesFiltros.bulkCreate(detallesData, { transaction: t });
                }
            }

            return producto;
        });

        return ApiResponse.success(res, {
            data: result,
            message: 'Producto actualizado exitosamente',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static updateStock = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { cantidad } = req.body; // can be negative

        const result = await sequelize.transaction(async (t) => {
            const producto = await Productos.findOne({
                where: { id, id_empresa: req.user.id_empresa },
                transaction: t
            });
            if (!producto) throw new Error('Producto no encontrado');

            const newStock = producto.stock_actual + cantidad;
            if (newStock < 0) throw new Error('El stock no puede ser negativo'); // Prevent negative stock if desired

            await producto.update({ stock_actual: newStock }, { transaction: t });
            return producto;
        });

        return ApiResponse.success(res, {
            data: result,
            message: 'Stock actualizado correctamente',
            status: 200,
            route: `${this.routes}/stock/${id}`
        });
    });

    static destroy = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;
        const producto = await Productos.findOne({ where: { id, id_empresa } });

        if (!producto) {
            return ApiResponse.error(res, {
                error: 'Producto no encontrado',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        await producto.destroy();

        return ApiResponse.success(res, {
            data: null,
            message: 'Producto eliminado (Soft Delete)',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static restore = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;
        const producto = await Productos.findOne({
            where: { id, id_empresa },
            paranoid: false
        });

        if (!producto) {
            return ApiResponse.error(res, {
                error: 'Producto no encontrado',
                status: 404,
                route: `${this.routes}/${id}/restore`
            });
        }

        if (!producto.deleted_at) {
            return ApiResponse.error(res, {
                error: 'El producto no está eliminado',
                status: 400,
                route: `${this.routes}/${id}/restore`
            });
        }

        await producto.restore();

        return ApiResponse.success(res, {
            data: producto,
            message: 'Producto restaurado correctamente',
            status: 200,
            route: `${this.routes}/${id}/restore`
        });
    });

    static forceDestroy = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;
        const producto = await Productos.findOne({
            where: { id, id_empresa },
            paranoid: false
        });

        if (!producto) {
            return ApiResponse.error(res, {
                error: 'Producto no encontrado',
                status: 404,
                route: `${this.routes}/${id}/force`
            });
        }

        if (producto.imagen_url) {
            const filename = producto.imagen_url.split('/').pop();
            await StorageController.deleteFileInternal(filename);
        }

        await producto.destroy({ force: true });

        return ApiResponse.success(res, {
            data: null,
            message: 'Producto eliminado definitivamente',
            status: 200,
            route: `${this.routes}/${id}/force`
        });
    });
}

module.exports = ProductosController;
