const { Pedidos, Productos, Clientes, DetallesPedidos, sequelize } = require('../models');
const { Op } = require('sequelize');
const catchErrors = require('../utils/tryCatch');
const ApiResponse = require('../utils/apiResponse');

class DashboardController {
    static routes = '/dashboard';

    static getMetrics = catchErrors(async (req, res) => {
        const { id_empresa } = req.user;

        const totalVentas = await Pedidos.sum('total_pedido', {
            where: { id_empresa }
        });

        const totalProductos = await Productos.count({
            where: { id_empresa }
        });

        return ApiResponse.success(res, {
            data: {
                total_ventas: totalVentas || 0,
                total_productos: totalProductos || 0
            },
            message: 'Métricas generales obtenidas correctamente',
            status: 200,
            route: `${this.routes}/metrics`
        });
    });

    static getTopProductos = catchErrors(async (req, res) => {
        const { id_empresa } = req.user;

        // 1. Get Top Product IDs and Total Sold
        const topStats = await DetallesPedidos.findAll({
            attributes: [
                'id_producto',
                [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_vendido']
            ],
            include: [{
                model: Productos,
                as: 'producto',
                attributes: [], // We only need the ID for grouping/filtering
                where: { id_empresa }
            }],
            group: ['DetallesPedidos.id_producto', 'producto.id'], // Minimal grouping
            order: [[sequelize.literal('total_vendido'), 'DESC']],
            limit: 5
        });

        if (topStats.length === 0) {
            return ApiResponse.success(res, {
                data: [],
                message: 'No hay datos suficientes',
                status: 200,
                route: `${this.routes}/top-productos`
            });
        }

        // 2. Fetch Full Product Details (including Variants for price)
        const productIds = topStats.map(item => item.id_producto);

        const productsDetails = await Productos.findAll({
            where: { id: productIds },
            attributes: ['id', 'nombre_producto', 'imagen_url'],
            include: [{
                model: require('../models').ProductoVariantes,
                as: 'variantes',
                attributes: ['precio_unitario']
            }]
        });

        // 3. Merge Data
        const mergedData = topStats.map(stat => {
            const product = productsDetails.find(p => p.id === stat.id_producto);
            // Convert Sequelize instance to plain object to attach extra property if needed, 
            // or just structure the response as expected by frontend
            return {
                id_producto: stat.id_producto,
                total_vendido: stat.get('total_vendido'),
                producto: product ? {
                    nombre_producto: product.nombre_producto,
                    imagen_url: product.imagen_url,
                    variantes: product.variantes // Pass variants to frontend
                } : null
            };
        });

        return ApiResponse.success(res, {
            data: mergedData,
            message: 'Ranking de productos obtenido correctamente',
            status: 200,
            route: `${this.routes}/top-productos`
        });
    });

    static getTopClientes = catchErrors(async (req, res) => {
        const { id_empresa } = req.user;

        // Top clientes con más pedidos realizados
        const topClientes = await Pedidos.findAll({
            attributes: [
                'id_cliente',
                [sequelize.fn('COUNT', sequelize.col('Pedidos.id')), 'total_pedidos'],
                [sequelize.fn('SUM', sequelize.col('total_pedido')), 'total_gastado']
            ],
            where: { id_empresa }, // Filter orders by company
            include: [{
                model: Clientes,
                as: 'cliente',
                attributes: ['nombre_cliente', 'apellido_cliente', 'correo_cliente']
            }],
            group: ['Pedidos.id_cliente', 'cliente.id', 'cliente.nombre_cliente', 'cliente.apellido_cliente', 'cliente.correo_cliente'],
            order: [[sequelize.literal('total_pedidos'), 'DESC']],
            limit: 5
        });

        return ApiResponse.success(res, {
            data: topClientes,
            message: 'Top clientes obtenido correctamente',
            status: 200,
            route: `${this.routes}/top-clientes`
        });
    });
}

module.exports = DashboardController;
