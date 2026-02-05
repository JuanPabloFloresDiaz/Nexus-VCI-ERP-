const { Pedidos, DetallesPedidos, Productos, Subcategorias, Categorias, Clientes, sequelize } = require('../models');
const { Op } = require('sequelize');
const catchErrors = require('../utils/tryCatch');
const ApiResponse = require('../utils/apiResponse');

class ChartsController {
    static routes = '/charts';

    // 1. Distribución de Estados de Pedidos
    static getOrderStatusDistribution = catchErrors(async (req, res) => {
        const { startDate, endDate } = req.query;

        const where = {};
        if (startDate && endDate) {
            where.created_at = { [Op.between]: [startDate, endDate] };
        } else if (startDate) {
            where.created_at = { [Op.gte]: startDate };
        } else if (endDate) {
            where.created_at = { [Op.lte]: endDate };
        }

        const distribucon = await Pedidos.findAll({
            where,
            attributes: [
                'estado_pedido',
                [sequelize.fn('COUNT', sequelize.col('id')), 'total']
            ],
            group: ['estado_pedido']
        });

        return ApiResponse.success(res, {
            data: distribucon,
            message: 'Distribución de estados obtenida correctamente',
            status: 200,
            route: `${this.routes}/order-status`
        });
    });

    // 2. Top Categorías Más Vendidas
    static getTopSellingCategories = catchErrors(async (req, res) => {
        const { startDate, endDate } = req.query;

        // Filter logic applies to the JOINed data usually, or creation date of order?
        // Usually dashboards filter by order date.
        // Complex query: Detalles -> Pedidos (filter date) -> Productos -> Sub -> Cat

        const wherePedido = {};
        if (startDate && endDate) {
            wherePedido.created_at = { [Op.between]: [startDate, endDate] };
        }

        const topCategories = await DetallesPedidos.findAll({
            attributes: [
                [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_vendido']
            ],
            include: [
                {
                    model: Pedidos,
                    as: 'pedido',
                    attributes: [],
                    where: wherePedido
                },
                {
                    model: Productos,
                    as: 'producto',
                    attributes: [],
                    include: [{
                        model: Subcategorias,
                        as: 'subcategoria',
                        attributes: [],
                        include: [{
                            model: Categorias,
                            as: 'categoria',
                            attributes: ['nombre_categoria']
                        }]
                    }]
                }
            ],
            // Grouping by Category Name
            group: ['producto.subcategoria.categoria.id', 'producto.subcategoria.categoria.nombre_categoria'],
            order: [[sequelize.literal('total_vendido'), 'DESC']],
            limit: 5 // Optional: maybe remove limit for "distribution" charts, let's keep it generally open or top 5
        });

        return ApiResponse.success(res, {
            data: topCategories,
            message: 'Top categorías obtenido correctamente',
            status: 200,
            route: `${this.routes}/top-categories`
        });
    });

    // 3. Historial de Ventas (Sum total_pedido by date)
    static getSalesHistory = catchErrors(async (req, res) => {
        const { startDate, endDate } = req.query;
        const where = {};
        if (startDate && endDate) {
            where.created_at = { [Op.between]: [startDate, endDate] };
        }

        // Group by DATE(created_at)
        // Syntax depends on dialect. Postgres: DATE(created_at). MySQL: DATE(created_at).
        // Sequelize default abstraction:
        const salesHistory = await Pedidos.findAll({
            where,
            attributes: [
                [sequelize.fn('DATE', sequelize.col('created_at')), 'fecha'],
                [sequelize.fn('SUM', sequelize.col('total_pedido')), 'total_venta']
            ],
            group: [sequelize.fn('DATE', sequelize.col('created_at'))],
            order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
        });

        return ApiResponse.success(res, {
            data: salesHistory,
            message: 'Historial de ventas obtenido correctamente',
            status: 200,
            route: `${this.routes}/sales-history`
        });
    });

    // 4. Historial de Pedidos (Count id by date)
    static getOrdersHistory = catchErrors(async (req, res) => {
        const { startDate, endDate } = req.query;
        const where = {};
        if (startDate && endDate) {
            where.created_at = { [Op.between]: [startDate, endDate] };
        }

        const ordersHistory = await Pedidos.findAll({
            where,
            attributes: [
                [sequelize.fn('DATE', sequelize.col('created_at')), 'fecha'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'total_pedidos']
            ],
            group: [sequelize.fn('DATE', sequelize.col('created_at'))],
            order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
        });

        return ApiResponse.success(res, {
            data: ordersHistory,
            message: 'Historial de pedidos obtenido correctamente',
            status: 200,
            route: `${this.routes}/orders-history`
        });
    });

    // 5. Historial de Nuevos Clientes
    static getNewClientsHistory = catchErrors(async (req, res) => {
        const { startDate, endDate } = req.query;
        const where = {};
        if (startDate && endDate) {
            where.created_at = { [Op.between]: [startDate, endDate] };
        }

        const clientsHistory = await Clientes.findAll({
            where,
            attributes: [
                [sequelize.fn('DATE', sequelize.col('created_at')), 'fecha'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'nuevos_clientes']
            ],
            group: [sequelize.fn('DATE', sequelize.col('created_at'))],
            order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
        });

        return ApiResponse.success(res, {
            data: clientsHistory,
            message: 'Historial de nuevos clientes obtenido correctamente',
            status: 200,
            route: `${this.routes}/new-clients-history`
        });
    });

    // 6. Ventas por Subcategoría (Parametrized by id_categoria)
    static getSalesBySubcategory = catchErrors(async (req, res) => {
        const { id_categoria, startDate, endDate } = req.query;

        if (!id_categoria) {
            return ApiResponse.error(res, {
                error: 'El parámetro id_categoria es requerido',
                status: 400,
                route: `${this.routes}/sales-by-subcategory`
            });
        }

        const wherePedido = {};
        if (startDate && endDate) {
            wherePedido.created_at = { [Op.between]: [startDate, endDate] };
        }

        const salesBySub = await DetallesPedidos.findAll({
            attributes: [
                [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_vendido']
            ],
            include: [
                {
                    model: Pedidos,
                    as: 'pedido',
                    attributes: [],
                    where: wherePedido
                },
                {
                    model: Productos,
                    as: 'producto',
                    attributes: [],
                    include: [{
                        model: Subcategorias,
                        as: 'subcategoria',
                        attributes: ['nombre_subcategoria'],
                        where: { id_categoria }
                    }]
                }
            ],
            group: ['producto.subcategoria.id', 'producto.subcategoria.nombre_subcategoria'],
            order: [[sequelize.literal('total_vendido'), 'DESC']]
        });

        return ApiResponse.success(res, {
            data: salesBySub,
            message: 'Ventas por subcategoría obtenidas correctamente',
            status: 200,
            route: `${this.routes}/sales-by-subcategory`
        });
    });
}

module.exports = ChartsController;
