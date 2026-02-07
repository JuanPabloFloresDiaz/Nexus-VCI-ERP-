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

        // Ranking de productos con más items vendidos
        const topProductos = await DetallesPedidos.findAll({
            attributes: [
                'id_producto',
                [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_vendido']
            ],
            include: [{
                model: Productos,
                as: 'producto',
                attributes: ['nombre_producto', 'imagen_url', 'precio_unitario'],
                where: { id_empresa } // Filter products by company
            }],
            group: ['DetallesPedidos.id_producto', 'producto.id', 'producto.nombre_producto', 'producto.imagen_url', 'producto.precio_unitario'],
            order: [[sequelize.literal('total_vendido'), 'DESC']],
            limit: 5
        });

        return ApiResponse.success(res, {
            data: topProductos,
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
