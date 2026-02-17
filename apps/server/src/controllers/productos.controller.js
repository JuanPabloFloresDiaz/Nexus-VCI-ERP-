const { Productos, ProductoVariantes, ProductoDetallesFiltros, Subcategorias, OpcionesFiltro, Filtros, StockAlmacenes, Almacenes, sequelize } = require('../models');
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

        // Price filter now applies to variants, so we need a tougher query or filter after join.
        // For simplicity in this refactor, we'll filter products that have AT LEAST one variant in range.
        const variantWhere = {};
        if (min_price !== undefined || max_price !== undefined) {
            variantWhere.precio_unitario = {};
            if (min_price) variantWhere.precio_unitario[Op.gte] = min_price;
            if (max_price) variantWhere.precio_unitario[Op.lte] = max_price;
        }

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
                    where: subcategoriaWhere
                },
                {
                    model: ProductoVariantes, // Changed from ProductoDetallesFiltros (which is now grandchild)
                    as: 'variantes',
                    where: Object.keys(variantWhere).length > 0 ? variantWhere : undefined, // Apply price filter
                    required: Object.keys(variantWhere).length > 0, // Inner join if filtering by price
                    include: [{
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
                    }, {
                        model: StockAlmacenes,
                        as: 'stock'
                    }]
                }
            ]
        });

        // Computed totals for display (e.g. total stock of all variants)
        const rowsWithTotals = data.rows.map(p => {
            const plain = p.get({ plain: true });

            // Calculate Totals from Variants
            if (plain.variantes && plain.variantes.length > 0) {
                const prices = plain.variantes.map(v => Number(v.precio_unitario));
                plain.precio_min = Math.min(...prices);
                plain.precio_max = Math.max(...prices);
                plain.stock_total = plain.variantes.reduce((sum, v) => {
                    const variantStock = v.stock ? v.stock.reduce((s, st) => s + st.stock_actual, 0) : 0;
                    return sum + variantStock;
                }, 0);
            } else {
                plain.precio_min = 0;
                plain.precio_max = 0;
                plain.stock_total = 0;
            }

            return plain;
        });

        return ApiResponse.success(res, {
            data: rowsWithTotals,
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
                    model: ProductoVariantes,
                    as: 'variantes',
                    include: [{
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
                    }, {
                        model: StockAlmacenes,
                        as: 'stock',
                        include: [{ model: Almacenes, as: 'almacen', attributes: ['nombre_almacen'] }]
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
        const { id_subcategoria, nombre_producto, descripcion_producto, imagen_url, variantes } = req.body;
        // Variants is an array of { sku, stock_actual, precio_unitario, costo_unitario, detalles: [{id_opcion_filtro}] }

        const result = await sequelize.transaction(async (t) => {
            // 1. Create Parent Product
            const newProducto = await Productos.create({
                id_empresa: req.user.id_empresa,
                id_subcategoria,
                id_usuario_gestor: req.user.id,
                nombre_producto,
                descripcion_producto,
                imagen_url
            }, { transaction: t });

            // 2. Create Variants
            if (variantes && variantes.length > 0) {
                // Find user's main warehouse
                const mainWarehouse = await Almacenes.findOne({
                    where: { id_empresa: req.user.id_empresa, es_principal: true, deleted_at: null },
                    transaction: t
                });
                // Fallback: search any warehouse or throw error? Better create one if missing (should exist by migration)
                const warehouseId = mainWarehouse ? mainWarehouse.id : null;

                for (const v of variantes) {
                    const newVariant = await ProductoVariantes.create({
                        id_producto: newProducto.id,
                        sku: v.sku,
                        // stock_actual removed
                        precio_unitario: v.precio_unitario,
                        costo_unitario: v.costo_unitario,
                        imagen_url: v.imagen_url || null
                    }, { transaction: t });

                    // Create Stock in Main Warehouse
                    if (warehouseId) { // Only if warehouse exists
                        await StockAlmacenes.create({
                            id_variante: newVariant.id,
                            id_almacen: warehouseId,
                            stock_actual: v.stock_actual || 0
                        }, { transaction: t });

                        // Note: Ideally create a Movement "Initial Inventory" log here too
                        if (v.stock_actual > 0) {
                            await MovimientosInventario.create({
                                id_empresa: req.user.id_empresa,
                                id_variante: newVariant.id,
                                id_almacen: warehouseId,
                                tipo_movimiento: 'Ajuste', // Initial load
                                cantidad: v.stock_actual,
                                costo_unitario: v.costo_unitario || 0,
                                fecha_movimiento: new Date()
                            }, { transaction: t });
                        }
                    }

                    // 3. Associate Filters to this Variant
                    if (v.detalles && v.detalles.length > 0) {
                        const detallesData = v.detalles.map(d => ({
                            id_variante: newVariant.id,
                            id_opcion_filtro: d.id_opcion_filtro
                        }));
                        await ProductoDetallesFiltros.bulkCreate(detallesData, { transaction: t });
                    }
                }
            } else {
                // Should we allow product without variants? Maybe generic one?
                // For now, allow it, but logic suggests at least one default variant implies "Simple Product"
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
        // Expected Input: Array of flat items (from Excel) logically representing variants.
        // Each item has: nombre_producto, descripcion, categoria/sub params, AND variant params (sku, price, stock) AND detalles (filters).
        // We need to GROUP by 'nombre_producto' to create 1 Parent + N Variants.

        const items = req.body;
        if (!items || items.length === 0) {
            return ApiResponse.success(res, { data: [], message: 'No se recibieron datos' });
        }

        const result = await sequelize.transaction(async (t) => {
            // 1. Group by Product Name
            // Map: "Name" -> { productData, variants: [] }
            const grouped = {};

            for (const item of items) {
                const nameKey = item.nombre_producto.trim();

                if (!grouped[nameKey]) {
                    grouped[nameKey] = {
                        data: {
                            id_empresa: req.user.id_empresa,
                            id_usuario_gestor: req.user.id,
                            nombre_producto: item.nombre_producto,
                            descripcion_producto: item.descripcion_producto,
                            imagen_url: item.imagen_url,
                            id_subcategoria: item.id_subcategoria
                        },
                        variants: []
                    };
                }

                // Add variant info
                grouped[nameKey].variants.push({
                    sku: item.sku,
                    stock_actual: item.stock_actual,
                    precio_unitario: item.precio_unitario,
                    costo_unitario: item.costo_unitario,
                    imagen_url: item.imagen_url, // Variant image could be same as product or different
                    detalles: item.detalles // [{ id_opcion_filtro }]
                });
            }

            const createdProducts = [];

            // 2. Process Groups
            for (const key in grouped) {
                const group = grouped[key];

                // Create Parent
                const newProd = await Productos.create(group.data, { transaction: t });

                // Create Variants
                for (const v of group.variants) {
                    const newVariant = await ProductoVariantes.create({
                        id_producto: newProd.id,
                        sku: v.sku,
                        stock_actual: v.stock_actual || 0,
                        precio_unitario: v.precio_unitario,
                        costo_unitario: v.costo_unitario,
                        imagen_url: v.imagen_url
                    }, { transaction: t });

                    // Create Filters for Variant
                    if (v.detalles && v.detalles.length > 0) {
                        const detallesData = v.detalles.map(d => ({
                            id_variante: newVariant.id,
                            id_opcion_filtro: d.id_opcion_filtro
                        }));
                        await ProductoDetallesFiltros.bulkCreate(detallesData, { transaction: t });
                    }
                }
                createdProducts.push(newProd);
            }

            return createdProducts;
        });

        return ApiResponse.success(res, {
            data: result, // Returns parent products
            message: `${result.length} productos (con sus variantes) creados exitosamente`,
            status: 201,
            route: `${this.routes}/bulk`
        });
    });

    static update = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;
        const { id_subcategoria, nombre_producto, descripcion_producto, imagen_url, variantes } = req.body;

        const producto = await Productos.findOne({ where: { id, id_empresa } });
        if (!producto) {
            return ApiResponse.error(res, { error: 'Producto no encontrado', status: 404 });
        }

        const result = await sequelize.transaction(async (t) => {
            // 1. Update Parent
            await producto.update({
                id_subcategoria,
                nombre_producto,
                descripcion_producto,
                imagen_url
            }, { transaction: t });

            // 2. Sync Variants
            // Complex part: Match by ID if exists, Create if new, Delete if missing?
            // "Replacing" approach (Delete All + Recreate) is dangerous for Order history (FK constraints Set Null).
            // Better approach for Refactor: Upsert.

            if (variantes) {
                // Get existing IDs
                const existingVariants = await ProductoVariantes.findAll({ where: { id_producto: id }, transaction: t });
                const existingIds = existingVariants.map(v => v.id);
                const incomingIds = variantes.filter(v => v.id).map(v => v.id);

                // Get Main Warehouse
                const mainWarehouse = await Almacenes.findOne({
                    where: { id_empresa: req.user.id_empresa, es_principal: true, deleted_at: null },
                    transaction: t
                });
                const warehouseId = mainWarehouse ? mainWarehouse.id : null;

                // Delete removed variants
                const toDelete = existingIds.filter(eid => !incomingIds.includes(eid));
                if (toDelete.length > 0) {
                    // Verify if they have orders? soft delete handles it.
                    await ProductoVariantes.destroy({ where: { id: toDelete }, transaction: t });
                }

                // Process input variants
                for (const v of variantes) {
                    let variantInstance;
                    if (v.id && existingIds.includes(v.id)) {
                        // Update
                        variantInstance = await ProductoVariantes.findOne({ where: { id: v.id }, transaction: t });
                        await variantInstance.update({
                            sku: v.sku,
                            // stock_actual removed from update
                            precio_unitario: v.precio_unitario,
                            costo_unitario: v.costo_unitario,
                            imagen_url: v.imagen_url
                        }, { transaction: t });
                    } else {
                        // Create
                        variantInstance = await ProductoVariantes.create({
                            id_producto: id,
                            sku: v.sku,
                            // stock_actual removed
                            precio_unitario: v.precio_unitario,
                            costo_unitario: v.costo_unitario,
                            imagen_url: v.imagen_url
                        }, { transaction: t });

                        // Initial Stock for new Variant
                        if (warehouseId) {
                            await StockAlmacenes.create({
                                id_variante: variantInstance.id,
                                id_almacen: warehouseId,
                                stock_actual: v.stock_actual || 0
                            }, { transaction: t });

                            if (v.stock_actual > 0) {
                                await MovimientosInventario.create({
                                    id_empresa: req.user.id_empresa,
                                    id_variante: variantInstance.id,
                                    id_almacen: warehouseId,
                                    tipo_movimiento: 'Ajuste', // Initial load
                                    cantidad: v.stock_actual,
                                    costo_unitario: v.costo_unitario || 0,
                                    fecha_movimiento: new Date()
                                }, { transaction: t });
                            }
                        }
                    }

                    // Sync filters for this variant
                    if (v.detalles) {
                        // Delete existing filters for this variant
                        await ProductoDetallesFiltros.destroy({ where: { id_variante: variantInstance.id }, transaction: t });
                        // Create new
                        if (v.detalles.length > 0) {
                            const detallesData = v.detalles.map(d => ({
                                id_variante: variantInstance.id,
                                id_opcion_filtro: d.id_opcion_filtro
                            }));
                            await ProductoDetallesFiltros.bulkCreate(detallesData, { transaction: t });
                        }
                    }
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

    static updateStockVariant = catchErrors(async (req, res) => {
        const { id } = req.params; // This is now VARIANT ID
        const { cantidad } = req.body;

        const result = await sequelize.transaction(async (t) => {
            const variante = await ProductoVariantes.findOne({
                where: { id },
                // Security: Should check if variant belongs to product of user's company... strict check requires joins
                include: [{ model: Productos, as: 'producto', where: { id_empresa: req.user.id_empresa } }],
                transaction: t
            });
            if (!variante) throw new Error('Variante no encontrada');

            const newStock = variante.stock_actual + cantidad;
            if (newStock < 0) throw new Error('El stock no puede ser negativo');

            await variante.update({ stock_actual: newStock }, { transaction: t });
            return variante;
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
