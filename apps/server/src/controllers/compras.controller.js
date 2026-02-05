const { Compras, DetallesCompras, Proveedores, Productos, sequelize } = require('../models');
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

        if (search) {
            // Search by total or nothing specific for now as main fields are IDs or Dates
            if (!isNaN(parseFloat(search))) {
                where.total_compra = search;
            }
        }

        if (id_proveedor) where.id_proveedor = id_proveedor;
        if (estado_compra) where.estado_compra = estado_compra;

        if (fecha_desde || fecha_hasta) {
            const dateFilter = {};
            if (fecha_desde) dateFilter[Op.gte] = new Date(fecha_desde + 'T00:00:00');
            if (fecha_hasta) dateFilter[Op.lte] = new Date(fecha_hasta + 'T23:59:59');
            where.created_at = dateFilter;
        }

        const data = await Compras.findAndCountAll({
            where,
            limit,
            offset,
            order,
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
                    attributes: ['id', 'nombre_proveedor', 'contacto_nombre', 'telefono_proveedor']
                },
                {
                    model: DetallesCompras,
                    as: 'detalles',
                    include: [{
                        model: Productos,
                        as: 'producto',
                        attributes: ['id', 'nombre_producto', 'stock_actual']
                    }]
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
                const producto = await Productos.findOne({ where: { id: item.id_producto, id_empresa }, transaction: t });
                if (!producto) throw new Error(`Producto ${item.id_producto} no encontrado`);

                const subtotal = Number(item.cantidad) * Number(item.precio_costo_historico);
                totalCompra += subtotal;

                // Update Stock (Increase) if purchase is 'Recibido' (default)
                if (estado_compra === 'Recibido') {
                    await producto.increment('stock_actual', { by: item.cantidad, transaction: t });

                    // Optional: Update producto costo_unitario with new cost? 
                    // Strategy: Weighted Average or Last Price? 
                    // For now, let's just update to the latest cost as a simple strategy or keep average.
                    // User didn't specify, but updating cost is common.
                    await producto.update({ costo_unitario: item.precio_costo_historico }, { transaction: t });
                }

                detallesToCreate.push({
                    id_producto: item.id_producto,
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
        const compras = req.body; // Array of compra objects
        const { id_empresa, id: id_usuario_comprador } = req.user;

        const result = await sequelize.transaction(async (t) => {
            const createdCompras = [];

            for (const c of compras) {
                const { id_proveedor, nuevo_proveedor, fecha_entrega_estimada, estado_compra, detalles } = c;
                let finalIdProveedor = id_proveedor;

                // 1. Handle Provider
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
                    // Should have been caught by validation, but verify
                    throw new Error('Proveedor no especificado en uno de los elementos');
                }

                // 2. Details
                let totalCompra = 0;
                const detallesToCreate = [];

                for (const item of detalles) {
                    const producto = await Productos.findOne({ where: { id: item.id_producto, id_empresa }, transaction: t });
                    if (!producto) throw new Error(`Producto ${item.id_producto} no encontrado`);

                    const subtotal = Number(item.cantidad) * Number(item.precio_costo_historico);
                    totalCompra += subtotal;

                    if (!c.estado_compra || c.estado_compra === 'Recibido') {
                        await producto.increment('stock_actual', { by: item.cantidad, transaction: t });
                        await producto.update({ costo_unitario: item.precio_costo_historico }, { transaction: t });
                    }

                    detallesToCreate.push({
                        id_producto: item.id_producto,
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
        // Only basic updates allowed (status, date). modifying details/totals is complex (stock reversion etc).
        // For now, simplify to just status/date.
        const { id } = req.params;
        const { estado_compra, fecha_entrega_estimada } = req.body;
        const { id_empresa } = req.user;

        const compra = await Compras.findOne({ where: { id, id_empresa } });
        if (!compra) {
            return ApiResponse.error(res, {
                error: 'Compra no encontrada',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        // TODO: Handle stock reversion if status changes from Recibido to Cancelado? 
        // Logic can be complex. For MVP/Task scope, we'll update fields. 
        // If strict inventory management is needed:
        // if (compra.estado_compra === 'Recibido' && estado_compra === 'Cancelado') -> Decrement stock
        // if (compra.estado_compra !== 'Recibido' && estado_compra === 'Recibido') -> Increment stock

        // Implementing basic safely logic:
        if (estado_compra && estado_compra !== compra.estado_compra) {
            // Re-fetch details to handle stock
            const fullCompra = await Compras.findByPk(id, {
                include: [{ model: DetallesCompras, as: 'detalles' }]
            });

            if (estado_compra === 'Cancelado' && compra.estado_compra === 'Recibido') {
                // Revert stock
                for (const d of fullCompra.detalles) {
                    await Productos.decrement('stock_actual', {
                        by: d.cantidad,
                        where: { id: d.id_producto }
                    });
                }
            } else if (estado_compra === 'Recibido' && compra.estado_compra !== 'Recibido') {
                // Apply stock
                for (const d of fullCompra.detalles) {
                    await Productos.increment('stock_actual', {
                        by: d.cantidad,
                        where: { id: d.id_producto }
                    });
                    // Note: We don't re-update cost here as it might be old price
                }
            }
        }

        await compra.update({ estado_compra, fecha_entrega_estimada });

        return ApiResponse.success(res, {
            data: compra,
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
        const { id_empresa } = req.user;

        const where = {
            ...query,
            id_empresa,
            deleted_at: { [Op.not]: null }
        };

        const data = await Compras.findAndCountAll({
            where,
            limit,
            offset,
            order,
            paranoid: false,
            include: [{ model: Proveedores, as: 'proveedor', attributes: ['nombre_proveedor'] }]
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
