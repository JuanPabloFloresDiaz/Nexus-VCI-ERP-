const { Pedidos, DetallesPedidos, Productos, Clientes, Subcategorias, Categorias, sequelize } = require('../models');
const { Op } = require('sequelize');
const catchErrors = require('../utils/tryCatch');
const ApiResponse = require('../utils/apiResponse');

class ChartsController {

    // Helper to get date range with time
    static getDateRange(startDate, endDate) {
        if (!startDate || !endDate) return {};

        // Ensure endDate covers the entire day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        return {
            [Op.between]: [start, end]
        };
    }

    // 1. Dashboard Summary Cards
    static getDashboardStats = catchErrors(async (req, res) => {
        const { id_empresa } = req.user;
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.created_at = ChartsController.getDateRange(startDate, endDate);
        }

        // Total Sales (Completed Orders)
        const totalSales = await Pedidos.sum('total_pedido', {
            where: {
                id_empresa,
                estado_pedido: 'Completado',
                ...dateFilter
            }
        });

        // Total Orders
        const totalOrders = await Pedidos.count({
            where: {
                id_empresa,
                ...dateFilter
            }
        });

        // Total Customers (Active)
        const totalCustomers = await Clientes.count({
            where: {
                id_empresa,
                deleted_at: null
            }
        });

        return ApiResponse.success(res, {
            data: {
                total_sales: totalSales || 0,
                total_orders: totalOrders || 0,
                total_customers: totalCustomers || 0
            }
        });
    });

    // 2. Sales History (Line Chart)
    static getSalesHistory = catchErrors(async (req, res) => {
        const { id_empresa } = req.user;
        const { startDate, endDate } = req.query;

        // Default to last 30 days if no range provided
        let end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        let start = startDate ? new Date(startDate) : new Date(new Date().setDate(end.getDate() - 30));
        start.setHours(0, 0, 0, 0);

        const sales = await Pedidos.findAll({
            attributes: [
                [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
                [sequelize.fn('SUM', sequelize.col('total_pedido')), 'total']
            ],
            where: {
                id_empresa,
                estado_pedido: 'Completado',
                created_at: { [Op.between]: [start, end] }
            },
            group: [sequelize.fn('DATE', sequelize.col('created_at'))],
            order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
        });

        return ApiResponse.success(res, { data: sales });
    });

    // 3. Top Selling Products (Bar Chart)
    static getTopProducts = catchErrors(async (req, res) => {
        const { id_empresa } = req.user;
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate && endDate) {
            // Filter using the associated Order's date for accuracy
            dateFilter.created_at = ChartsController.getDateRange(startDate, endDate);
        }

        const topProducts = await DetallesPedidos.findAll({
            attributes: [
                [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_quantity'],
                [sequelize.literal('`producto`.`nombre_producto`'), 'product_name']
            ],
            include: [
                {
                    model: Productos,
                    as: 'producto',
                    attributes: [],
                    where: { id_empresa },
                    required: true
                },
                {
                    model: Pedidos,
                    as: 'pedido', // Verify alias in update!
                    attributes: [],
                    where: {
                        id_empresa,
                        estado_pedido: 'Completado', // Only completed orders
                        ...dateFilter
                    },
                    required: true
                }
            ],
            group: ['producto.id', 'producto.nombre_producto'],
            order: [[sequelize.literal('total_quantity'), 'DESC']],
            limit: 5
        });

        return ApiResponse.success(res, { data: topProducts });
    });

    // 4. Order Status Distribution (Doughnut Chart)
    static getOrderStatus = catchErrors(async (req, res) => {
        const { id_empresa } = req.user;
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.created_at = ChartsController.getDateRange(startDate, endDate);
        }

        const statusCounts = await Pedidos.findAll({
            attributes: [
                'estado_pedido',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: {
                id_empresa,
                ...dateFilter
            },
            group: ['estado_pedido']
        });

        return ApiResponse.success(res, { data: statusCounts });
    });

    // 5. Top Categories (Bar/Pie Chart)
    static getTopCategories = catchErrors(async (req, res) => {
        const { id_empresa } = req.user;
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.created_at = ChartsController.getDateRange(startDate, endDate);
        }

        const topCategories = await DetallesPedidos.findAll({
            attributes: [
                [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_quantity'],
                [sequelize.literal('`producto->subcategoria->categoria`.`nombre_categoria`'), 'category_name']
            ],
            include: [
                {
                    model: Productos,
                    as: 'producto',
                    attributes: [],
                    required: true,
                    where: { id_empresa },
                    include: [{
                        model: Subcategorias,
                        as: 'subcategoria',
                        attributes: [],
                        required: true,
                        include: [{
                            model: Categorias,
                            as: 'categoria',
                            attributes: [],
                            required: true
                        }]
                    }]
                },
                {
                    model: Pedidos,
                    as: 'pedido',
                    attributes: [],
                    where: {
                        id_empresa,
                        estado_pedido: 'Completado',
                        ...dateFilter
                    },
                    required: true
                }
            ],
            group: ['producto.subcategoria.categoria.id', 'producto.subcategoria.categoria.nombre_categoria'],
            order: [[sequelize.literal('total_quantity'), 'DESC']],
            limit: 5
        });

        return ApiResponse.success(res, { data: topCategories });
    });
}

module.exports = ChartsController;
