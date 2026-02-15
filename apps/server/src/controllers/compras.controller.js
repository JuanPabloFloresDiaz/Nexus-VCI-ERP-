const { Compras, DetallesCompras, Proveedores, Productos, ProductoVariantes, sequelize } = require('../models');
const { Op } = require('sequelize');
const catchErrors = require('../utils/tryCatch');
const ApiResponse = require('../utils/apiResponse');
const getPaginatedQuery = require('../utils/getPaginatedQuery');

class ComprasController {
    static routes = '/compras';

    static index = catchErrors(async (req, res) => {
        const { query, limit, offset, order } = getPaginatedQuery(req.query);
        const { search, id_proveedor, estado_compra, fecha_desde, fecha_hasta } = req.query;
        const { id_empresa } = req.user;

        const where = { ...query, id_empresa };

        // 1. Generic Search (Total only)
        if (search) {
            const searchConditions = [];
            // Check if search is numeric (for total_compra)
            if (!isNaN(parseFloat(search)) && isFinite(search)) {
                searchConditions.push({ total_compra: search });
            }

            if (searchConditions.length > 0) {
                where[Op.or] = searchConditions;
            }
        }

        // 2. Specific Filters
        if (id_proveedor) {
            where.id_proveedor = id_proveedor;
        }

        if (estado_compra) {
            where.estado_compra = estado_compra;
        }

        if (fecha_desde || fecha_hasta) {
            const dateFilter = {};
            if (fecha_desde) {
                dateFilter[Op.gte] = new Date(fecha_desde + 'T00:00:00');
            }
            if (fecha_hasta) {
                dateFilter[Op.lte] = new Date(fecha_hasta + 'T23:59:59');
            }
            where.created_at = dateFilter;
        }

        const data = await Compras.findAndCountAll({
            where,
            limit,
            offset,
            order,
            distinct: true,
            include: [{
                model: Proveedores,
                as: 'proveedor',
                attributes: ['id', 'nombre_proveedor']
            }]
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Listado de compras obtenido correctamente',
            status: 200,
            route: this.routes
        });
    });

    static getById = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;

        const compra = await Compras.findOne({
            where: { id, id_empresa },
            include: [
                {
                    model: Proveedores,
                    as: 'proveedor',
                    attributes: ['id', 'nombre_proveedor', 'contacto_nombre', 'telefono_proveedor', 'correo_proveedor']
                },
                {
                    model: DetallesCompras,
                    as: 'detalles',
                    include: [
                        {
                            model: Productos,
                            as: 'producto',
                            attributes: ['id', 'nombre_producto', 'imagen_url']
                        },
                        {
                            model: ProductoVariantes,
                            as: 'variante',
                            attributes: ['id', 'sku', 'stock_actual']
                        }
                    ]
                }
            ]
        });

        if (!compra) {
            return ApiResponse.error(res, {
                error: 'Compra no encontrada',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        return ApiResponse.success(res, {
            data: compra,
            message: 'Compra obtenida correctamente',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static store = catchErrors(async (req, res) => {
        const { id_proveedor, nuevo_proveedor, fecha_entrega_estimada, estado_compra, detalles } = req.body;
        const { id_empresa, id: id_usuario_comprador } = req.user;

        const result = await sequelize.transaction(async (t) => {
            let finalIdProveedor = id_proveedor;

            // 1. Handle Provider (Existing or New)
            if (nuevo_proveedor) {
                // Check if name exists
                const existingProv = await Proveedores.findOne({
                    where: { nombre_proveedor: nuevo_proveedor.nombre_proveedor, id_empresa },
                    transaction: t
                });

                if (existingProv) {
                    finalIdProveedor = existingProv.id;
                } else {
                    const createdProv = await Proveedores.create({
                        ...nuevo_proveedor,
                        id_empresa
                    }, { transaction: t });
                    finalIdProveedor = createdProv.id;
                }
            } else if (id_proveedor) {
                // Verify existence
                const prov = await Proveedores.findOne({ where: { id: id_proveedor, id_empresa }, transaction: t });
                if (!prov) throw new Error('Proveedor no encontrado');
            }

            // 2. Process Details and Calculate Total
            let totalCompra = 0;
            const detallesToCreate = [];

            for (const item of detalles) {
                // Fetch Variant
                const variant = await ProductoVariantes.findOne({
                    where: { id: item.id_variante },
                    include: [{ model: Productos, as: 'producto', where: { id_empresa } }],
                    transaction: t
                });
                if (!variant) throw new Error(`Variante ${item.id_variante} no encontrada`);

                const subtotal = Number(item.cantidad) * Number(item.precio_costo_historico);
                totalCompra += subtotal;

                // Update Stock (Increase) if purchase is 'Recibido' (default)
                if (estado_compra === 'Recibido') {
                    await variant.increment('stock_actual', { by: item.cantidad, transaction: t });
                    // Update cost to latest
                    await variant.update({ costo_unitario: item.precio_costo_historico }, { transaction: t });
                }

                detallesToCreate.push({
                    id_producto: variant.id_producto,
                    id_variante: variant.id,
                    cantidad: item.cantidad,
                    precio_costo_historico: item.precio_costo_historico,
                    subtotal
                });
            }

            // 3. Create Compra
            const newCompra = await Compras.create({
                id_empresa,
                id_proveedor: finalIdProveedor,
                id_usuario_comprador,
                total_compra: totalCompra,
                estado_compra,
                fecha_entrega_estimada
            }, { transaction: t });

            // 4. Create Detalles
            const detallesWithId = detallesToCreate.map(d => ({ ...d, id_compra: newCompra.id }));
            await DetallesCompras.bulkCreate(detallesWithId, { transaction: t });

            return newCompra;
        });

        return ApiResponse.success(res, {
            data: result,
            message: 'Compra registrada exitosamente',
            status: 201,
            route: this.routes
        });
    });

    static bulkStore = catchErrors(async (req, res) => {
        const compras = req.body;
        const { id_empresa, id: id_usuario_comprador } = req.user;

        const result = await sequelize.transaction(async (t) => {
            const createdCompras = [];

            for (const c of compras) {
                const { id_proveedor, nuevo_proveedor, fecha_entrega_estimada, estado_compra, detalles } = c;
                let finalIdProveedor = id_proveedor;

                if (nuevo_proveedor) {
                    const existingProv = await Proveedores.findOne({
                        where: { nombre_proveedor: nuevo_proveedor.nombre_proveedor, id_empresa },
                        transaction: t
                    });

                    if (existingProv) {
                        finalIdProveedor = existingProv.id;
                    } else {
                        const createdProv = await Proveedores.create({
                            ...nuevo_proveedor,
                            id_empresa
                        }, { transaction: t });
                        finalIdProveedor = createdProv.id;
                    }
                } else if (!finalIdProveedor) {
                    throw new Error('Proveedor no especificado en uno de los elementos');
                }

                let totalCompra = 0;
                const detallesToCreate = [];

                for (const item of detalles) {
                    const variant = await ProductoVariantes.findOne({
                        where: { id: item.id_variante },
                        include: [{ model: Productos, as: 'producto', where: { id_empresa } }],
                        transaction: t
                    });
                    if (!variant) throw new Error(`Variante ${item.id_variante} no encontrada`);

                    const subtotal = Number(item.cantidad) * Number(item.precio_costo_historico);
                    totalCompra += subtotal;

                    // If 'Recibido', update stock
                    if (!c.estado_compra || c.estado_compra === 'Recibido') {
                        await variant.increment('stock_actual', { by: item.cantidad, transaction: t });
                        await variant.update({ costo_unitario: item.precio_costo_historico }, { transaction: t });
                    }

                    detallesToCreate.push({
                        id_producto: variant.id_producto,
                        id_variante: variant.id,
                        cantidad: item.cantidad,
                        precio_costo_historico: item.precio_costo_historico,
                        subtotal
                    });
                }

                const newCompra = await Compras.create({
                    id_empresa,
                    id_proveedor: finalIdProveedor,
                    id_usuario_comprador,
                    total_compra: totalCompra,
                    estado_compra: c.estado_compra || 'Recibido',
                    fecha_entrega_estimada
                }, { transaction: t });

                const detallesWithId = detallesToCreate.map(d => ({ ...d, id_compra: newCompra.id }));
                await DetallesCompras.bulkCreate(detallesWithId, { transaction: t });
                createdCompras.push(newCompra);
            }
            return createdCompras;
        });

        return ApiResponse.success(res, {
            data: result,
            message: `${result.length} compras creadas exitosamente`,
            status: 201,
            route: `${this.routes}/bulk`
        });
    });

    static update = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { estado_compra, fecha_entrega_estimada, detalles } = req.body;
        const { id_empresa } = req.user;

        const result = await sequelize.transaction(async (t) => {
            // 1. Fetch original purchase
            const compra = await Compras.findOne({
                where: { id, id_empresa },
                include: [{ model: DetallesCompras, as: 'detalles' }],
                transaction: t
            });

            if (!compra) throw new Error('Compra no encontrada');

            // 2. Revert Stock from OLD details
            // Logic: If the purchase WAS 'Recibido', we added stock. We must remove it before applying any new state.
            if (compra.estado_compra === 'Recibido') {
                for (const d of compra.detalles) {
                    if (d.id_variante) {
                        await ProductoVariantes.decrement('stock_actual', {
                            by: d.cantidad,
                            where: { id: d.id_variante },
                            transaction: t
                        });
                    } else {
                        console.warn(`Legacy detail without id_variante in purchase ${id}`);
                    }
                }
            }

            // 3. Delete Old Details (only if details are being updated)
            if (detalles) {
                await DetallesCompras.destroy({
                    where: { id_compra: id },
                    transaction: t
                });
            } else {
                // Keeping old details, logic follows below
            }

            // 4. Update Header
            const newStatus = estado_compra || compra.estado_compra;
            await compra.update({
                estado_compra: newStatus,
                fecha_entrega_estimada: fecha_entrega_estimada || compra.fecha_entrega_estimada,
                // Update total if details changed
                total_compra: detalles ? 0 : compra.total_compra // Will recount below if details
            }, { transaction: t });

            // 5. Apply New Stock and (Re)Create Details
            let totalCompra = 0;
            const detallesToCreate = [];

            if (detalles) {
                // CASE A: New Details Provided
                for (const item of detalles) {
                    const variant = await ProductoVariantes.findOne({
                        where: { id: item.id_variante },
                        include: [{ model: Productos, as: 'producto', where: { id_empresa } }],
                        transaction: t
                    });
                    if (!variant) throw new Error(`Variante ${item.id_variante} no encontrada`);

                    const subtotal = Number(item.cantidad) * Number(item.precio_costo_historico);
                    totalCompra += subtotal;

                    // Apply Stock if New Status is 'Recibido'
                    if (newStatus === 'Recibido') {
                        await variant.increment('stock_actual', { by: item.cantidad, transaction: t });
                        await variant.update({ costo_unitario: item.precio_costo_historico }, { transaction: t });
                    }

                    detallesToCreate.push({
                        id_compra: id,
                        id_producto: variant.id_producto,
                        id_variante: variant.id,
                        cantidad: item.cantidad,
                        precio_costo_historico: item.precio_costo_historico,
                        subtotal
                    });
                }

                // Bulk Create
                await DetallesCompras.bulkCreate(detallesToCreate, { transaction: t });
                // Update Total
                await compra.update({ total_compra: totalCompra }, { transaction: t });

            } else {
                // CASE B: Only Status/Date Change (No Details in Body)
                // We already reverted stock above if it was 'Recibido'.
                // Now if new status is 'Recibido', we must apply stock again (using existing details).

                if (newStatus === 'Recibido') {
                    for (const d of compra.detalles) {
                        if (d.id_variante) {
                            await ProductoVariantes.increment('stock_actual', {
                                by: d.cantidad,
                                where: { id: d.id_variante },
                                transaction: t
                            });
                            await ProductoVariantes.update(
                                { costo_unitario: d.precio_costo_historico },
                                { where: { id: d.id_variante }, transaction: t }
                            );
                        }
                    }
                }
            }

            return compra;
        });

        return ApiResponse.success(res, {
            data: result,
            message: 'Compra actualizada correctamente',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static destroy = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;
        const compra = await Compras.findOne({ where: { id, id_empresa } });

        if (!compra) {
            return ApiResponse.error(res, {
                error: 'Compra no encontrada',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        await compra.destroy();

        return ApiResponse.success(res, {
            data: null,
            message: 'Compra eliminada (Soft Delete)',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static restore = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;
        const compra = await Compras.findOne({
            where: { id, id_empresa },
            paranoid: false
        });

        if (!compra) {
            return ApiResponse.error(res, {
                error: 'Compra no encontrada',
                status: 404,
                route: `${this.routes}/${id}/restore`
            });
        }

        await compra.restore();

        return ApiResponse.success(res, {
            data: compra,
            message: 'Compra restaurada correctamente',
            status: 200,
            route: `${this.routes}/${id}/restore`
        });
    });

    static trashed = catchErrors(async (req, res) => {
        const { query, limit, offset, order } = getPaginatedQuery(req.query);
        const { search, id_proveedor, estado_compra } = req.query;
        const { id_empresa } = req.user;

        const where = {
            ...query,
            id_empresa,
            deleted_at: { [Op.not]: null }
        };

        if (search) {
            if (!isNaN(parseFloat(search)) && isFinite(search)) {
                where.total_compra = search;
            }
        }

        if (id_proveedor) where.id_proveedor = id_proveedor;
        if (estado_compra) where.estado_compra = estado_compra;

        const data = await Compras.findAndCountAll({
            where,
            limit,
            offset,
            order,
            paranoid: false,
            include: [{ model: Proveedores, as: 'proveedor', attributes: ['id', 'nombre_proveedor'] }]
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Papelera de compras obtenida correctamente',
            status: 200,
            route: `${this.routes}/trashed`
        });
    });

    static forceDestroy = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;
        const compra = await Compras.findOne({
            where: { id, id_empresa },
            paranoid: false
        });

        if (!compra) {
            return ApiResponse.error(res, {
                error: 'Compra no encontrada',
                status: 404,
                route: `${this.routes}/${id}/force`
            });
        }

        await compra.destroy({ force: true });

        return ApiResponse.success(res, {
            data: null,
            message: 'Compra eliminada definitivamente',
            status: 200,
            route: `${this.routes}/${id}/force`
        });
    });
}

module.exports = ComprasController;
