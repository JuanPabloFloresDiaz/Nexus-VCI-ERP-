const { MovimientosInventario, StockAlmacenes, ProductoVariantes, Almacenes, Productos, sequelize } = require('../models');
const { Op } = require('sequelize');
const catchErrors = require('../utils/tryCatch');
const ApiResponse = require('../utils/apiResponse');
const getPaginatedQuery = require('../utils/getPaginatedQuery');

class MovimientosController {
    static routes = '/movimientos';

    static index = catchErrors(async (req, res) => {
        const { query, limit, offset, order } = getPaginatedQuery(req.query);
        const { search, id_almacen, tipo_movimiento, fecha_inicio, fecha_fin } = req.query;
        const { id_empresa } = req.user;

        const where = { ...query, id_empresa };

        if (id_almacen) where.id_almacen = id_almacen;
        if (tipo_movimiento) where.tipo_movimiento = tipo_movimiento;

        if (fecha_inicio && fecha_fin) {
            where.fecha_movimiento = { [Op.between]: [fecha_inicio, fecha_fin] };
        }

        const data = await MovimientosInventario.findAndCountAll({
            where,
            limit,
            offset,
            order: [['fecha_movimiento', 'DESC']], // Default default Kardex order
            include: [
                { model: Almacenes, as: 'almacen', attributes: ['nombre_almacen'] },
                {
                    model: ProductoVariantes,
                    as: 'variante',
                    include: [{ model: Productos, as: 'producto', attributes: ['nombre_producto'] }]
                }
            ]
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Historial de movimientos obtenido correctamente',
            status: 200,
            route: this.routes
        });
    });

    static trashed = catchErrors(async (req, res) => {
        // Ledger usually doesn't have soft delete exposed, but user requested standard CRUD.
        const { query, limit, offset, order } = getPaginatedQuery(req.query);
        const { id_empresa } = req.user;

        const where = {
            ...query,
            id_empresa,
            deleted_at: { [Op.not]: null }
        };

        const data = await MovimientosInventario.findAndCountAll({
            where,
            limit,
            offset,
            order,
            paranoid: false
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Papelera de movimientos obtenida correctamente',
            status: 200,
            route: `${this.routes}/trashed`
        });
    });

    static getById = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;

        const movimiento = await MovimientosInventario.findOne({
            where: { id, id_empresa },
            include: [
                { model: Almacenes, as: 'almacen' },
                { model: ProductoVariantes, as: 'variante', include: ['producto'] }
            ]
        });

        if (!movimiento) {
            return ApiResponse.error(res, { error: 'Movimiento no encontrado', status: 404 });
        }

        return ApiResponse.success(res, {
            data: movimiento,
            message: 'Movimiento obtenido correctamente',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static store = catchErrors(async (req, res) => {
        // Manual adjustment or single movement creation
        const { id_variante, id_almacen, tipo_movimiento, cantidad, costo_unitario } = req.body;
        const { id_empresa } = req.user;

        const result = await sequelize.transaction(async (t) => {
            // Validate Warehouse
            const almacen = await Almacenes.findOne({ where: { id: id_almacen, id_empresa }, transaction: t });
            if (!almacen) throw new Error('Almacén no encontrado');

            // Validate Variant
            const variante = await ProductoVariantes.findOne({ where: { id: id_variante }, transaction: t });
            if (!variante) throw new Error('Variante no encontrada');

            // Update Stock
            let stockEntry = await StockAlmacenes.findOne({
                where: { id_variante, id_almacen },
                transaction: t
            });

            if (!stockEntry) {
                stockEntry = await StockAlmacenes.create({
                    id_empresa, id_variante, id_almacen, stock_actual: 0
                }, { transaction: t });
            }

            // Logic: 
            // Entrada/Ajuste (Positive) -> Increment
            // Salida/Venta (Negative impact, but usually Input Quantity is positive) -> Decrement
            // Let's assume input 'cantidad' is absolute positive.

            // Mapping Logic for DB ENUM ('Compra', 'Venta', 'Ajuste', 'Traslado')
            let dbTipoMovimiento = tipo_movimiento;
            if (['Entrada', 'Salida'].includes(tipo_movimiento)) {
                dbTipoMovimiento = 'Ajuste';
            } else if (tipo_movimiento === 'Transferencia') {
                dbTipoMovimiento = 'Traslado';
            }

            const qty = Number(cantidad);
            if (['Entrada', 'Compra', 'Ajuste'].includes(tipo_movimiento)) {
                await stockEntry.increment('stock_actual', { by: qty, transaction: t });
            } else if (['Salida', 'Venta'].includes(tipo_movimiento)) {
                if (stockEntry.stock_actual < qty) throw new Error('Stock insuficiente');
                await stockEntry.decrement('stock_actual', { by: qty, transaction: t });
            }

            // Create Movement
            const mov = await MovimientosInventario.create({
                id_empresa,
                id_variante,
                id_almacen,
                tipo_movimiento: dbTipoMovimiento,
                cantidad: ['Salida', 'Venta'].includes(tipo_movimiento) ? -qty : qty,
                costo_unitario: costo_unitario || variante.costo_unitario,
                fecha_movimiento: new Date()
            }, { transaction: t });

            return mov;
        });

        return ApiResponse.success(res, {
            data: result,
            message: 'Movimiento registrado correctamente',
            status: 201,
            route: this.routes
        });
    });

    static update = catchErrors(async (req, res) => {
        // Warning: Updating a ledger entry is dangerous. 
        // We generally allowed editing 'notas' but not quantities/stock effects without a compensating transaction.
        // For strict CRUD compliance requested by user:
        const { id } = req.params;
        const { notas } = req.body;
        const { id_empresa } = req.user;

        const movimiento = await MovimientosInventario.findOne({ where: { id, id_empresa } });
        if (!movimiento) return ApiResponse.error(res, { error: 'Movimiento no encontrado', status: 404 });

        await movimiento.update({ notas });

        return ApiResponse.success(res, {
            data: movimiento,
            message: 'Movimiento actualizado (Sólo notas)',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static destroy = catchErrors(async (req, res) => {
        // Soft delete - DOES NOT REVERT STOCK. Only hides record.
        const { id } = req.params;
        const { id_empresa } = req.user;

        const movimiento = await MovimientosInventario.findOne({ where: { id, id_empresa } });
        if (!movimiento) return ApiResponse.error(res, { error: 'Movimiento no encontrado', status: 404 });

        await movimiento.destroy();

        return ApiResponse.success(res, {
            data: null,
            message: 'Movimiento eliminado (Soft Delete)',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static restore = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;
        const movimiento = await MovimientosInventario.findOne({ where: { id, id_empresa }, paranoid: false });

        if (!movimiento) return ApiResponse.error(res, { error: 'Movimiento no encontrado', status: 404 });

        await movimiento.restore();

        return ApiResponse.success(res, {
            data: movimiento,
            message: 'Movimiento restaurado',
            status: 200,
            route: `${this.routes}/${id}/restore`
        });
    });

    static forceDestroy = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;
        const movimiento = await MovimientosInventario.findOne({ where: { id, id_empresa }, paranoid: false });

        if (!movimiento) return ApiResponse.error(res, { error: 'Movimiento no encontrado', status: 404 });

        await movimiento.destroy({ force: true });

        return ApiResponse.success(res, {
            data: null,
            message: 'Movimiento eliminado definitivamente',
            status: 200,
            route: `${this.routes}/${id}/force`
        });
    });

    static transferir = catchErrors(async (req, res) => {
        const { id_almacen_origen, id_almacen_destino, items } = req.body; // items: [{ id_variante, cantidad }]
        const { id_empresa } = req.user;

        if (id_almacen_origen === id_almacen_destino) {
            return ApiResponse.error(res, { error: 'El almacén de origen y destino no pueden ser iguales', status: 400 });
        }

        const result = await sequelize.transaction(async (t) => {
            // Validate Warehouses Once
            const origen = await Almacenes.findOne({ where: { id: id_almacen_origen, id_empresa }, transaction: t });
            const destino = await Almacenes.findOne({ where: { id: id_almacen_destino, id_empresa }, transaction: t });

            if (!origen) throw new Error('Almacén origen no encontrado');
            if (!destino) throw new Error('Almacén destino no encontrado');

            const results = [];

            for (const item of items) {
                const { id_variante, cantidad } = item;

                // Validate Origin Stock
                const stockOrigen = await StockAlmacenes.findOne({
                    where: { id_variante, id_almacen: id_almacen_origen },
                    transaction: t
                });

                if (!stockOrigen || stockOrigen.stock_actual < cantidad) {
                    // Fetch product name for better error message if possible, or just error out
                    throw new Error(`Stock insuficiente en origen para la variante ${id_variante}`);
                }

                // Get or Create Destination Stock
                let stockDestino = await StockAlmacenes.findOne({
                    where: { id_variante, id_almacen: id_almacen_destino },
                    transaction: t
                });

                if (!stockDestino) {
                    stockDestino = await StockAlmacenes.create({
                        id_empresa,
                        id_variante,
                        id_almacen: id_almacen_destino,
                        // If it doesn't exist, start with 0
                        stock_actual: 0
                    }, { transaction: t });
                }

                // Execute Transfer logic
                await stockOrigen.decrement('stock_actual', { by: cantidad, transaction: t });
                await stockDestino.increment('stock_actual', { by: cantidad, transaction: t });

                // Log Movements
                // 1. Out from Origin
                await MovimientosInventario.create({
                    id_empresa,
                    id_variante,
                    id_almacen: id_almacen_origen,
                    tipo_movimiento: 'Traslado',
                    cantidad: -cantidad,
                    costo_unitario: 0, // Transfer cost logic could be complex, keeping 0 or carrying over avg cost
                    fecha_movimiento: new Date(),
                    id_referencia: id_almacen_destino // Reference to destination warehouse ID? Or other Mov ID?
                }, { transaction: t });

                // 2. In to Destination
                await MovimientosInventario.create({
                    id_empresa,
                    id_variante,
                    id_almacen: id_almacen_destino,
                    tipo_movimiento: 'Traslado',
                    cantidad: cantidad,
                    costo_unitario: 0,
                    fecha_movimiento: new Date(),
                    id_referencia: id_almacen_origen
                }, { transaction: t });

                results.push({ id_variante, status: 'transferred' });
            }

            return results;
        });

        return ApiResponse.success(res, {
            data: result,
            message: 'Transferencia realizada con éxito',
            status: 200,
            route: `${this.routes}/transferir`
        });
    });
}

module.exports = MovimientosController;
