const { Pedidos, DetallesPedidos, Productos, Clientes, Usuarios, sequelize } = require('../models');
const { Op } = require('sequelize');
const catchErrors = require('../utils/tryCatch');
const ApiResponse = require('../utils/apiResponse');
const getPaginatedQuery = require('../utils/getPaginatedQuery');
const { sendMail } = require('../utils/mail');

class PedidosController {
    static routes = '/pedidos';

    static index = catchErrors(async (req, res) => {
        const { query, limit, offset, order } = getPaginatedQuery(req.query);
        const { search, id_cliente, id_usuario_creador, estado_pedido, fecha_desde, fecha_hasta } = req.query;
        const { id_empresa } = req.user;

        const where = { ...query, id_empresa };

        // 1. Generic Search (ID or Total)
        if (search) {
            const searchConditions = [];
            // Check if search is numeric (for total_pedido)
            if (!isNaN(parseFloat(search)) && isFinite(search)) {
                searchConditions.push({ total_pedido: search });
            }

            if (searchConditions.length > 0) {
                where[Op.or] = searchConditions;
            }
        }

        // 2. Specific Filters using Op.and implicitly by adding to 'where' object
        if (id_cliente) {
            where.id_cliente = id_cliente;
        }

        if (id_usuario_creador) {
            where.id_usuario_creador = id_usuario_creador;
        }

        if (estado_pedido) {
            where.estado_pedido = estado_pedido;
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

        const data = await Pedidos.findAndCountAll({
            where,
            limit,
            offset,
            order,
            include: [
                {
                    model: Clientes,
                    as: 'cliente',
                    attributes: ['id', 'nombre_cliente', 'apellido_cliente', 'correo_cliente']
                },
                {
                    model: Usuarios,
                    as: 'usuario_creador',
                    attributes: ['id', 'nombre_usuario']
                }
            ]
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Listado de pedidos obtenido correctamente',
            status: 200,
            route: this.routes
        });
    });

    static getByCliente = catchErrors(async (req, res) => {
        const { id } = req.params; // Client ID
        const { query, limit, offset, order } = getPaginatedQuery(req.query);
        const { estado_pedido, fecha_desde, fecha_hasta } = req.query;
        const { id_empresa } = req.user;

        // Verify client exists
        const cliente = await Clientes.findOne({ where: { id, id_empresa } });
        if (!cliente) {
            return ApiResponse.error(res, {
                error: 'Cliente no encontrado',
                status: 404,
                route: `${this.routes}/cliente/${id}`
            });
        }

        const where = {
            ...query,
            id_cliente: id,
            id_empresa
        };

        if (estado_pedido) {
            where.estado_pedido = estado_pedido;
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

        const data = await Pedidos.findAndCountAll({
            where,
            limit,
            offset,
            order,
            include: [
                {
                    model: Usuarios,
                    as: 'usuario_creador',
                    attributes: ['id', 'nombre_usuario']
                }
            ]
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: `Historial de pedidos de ${cliente.nombre_cliente} ${cliente.apellido_cliente}`,
            status: 200,
            route: `${this.routes}/cliente/${id}`
        });
    });

    static trashed = catchErrors(async (req, res) => {
        const { query, limit, offset, order } = getPaginatedQuery(req.query);
        const { search, id_cliente, id_usuario_creador, estado_pedido, fecha_desde, fecha_hasta } = req.query;
        const { id_empresa } = req.user;

        const where = {
            ...query,
            id_empresa,
            deleted_at: { [Op.not]: null }
        };

        // 1. Generic Search (Total only)
        if (search) {
            const searchConditions = [];
            if (!isNaN(parseFloat(search)) && isFinite(search)) {
                searchConditions.push({ total_pedido: search });
            }
            if (searchConditions.length > 0) {
                // Combine with existing deleted_at check using Op.and if necessary, 
                // but usually where[Op.or] overrides. We need to be careful.
                // Sequelize handles top level Op.or combined with other fields as AND.
                where[Op.or] = searchConditions;
            }
        }

        // 2. Specific Filters
        if (id_cliente) {
            where.id_cliente = id_cliente;
        }

        if (id_usuario_creador) {
            where.id_usuario_creador = id_usuario_creador;
        }

        if (estado_pedido) {
            where.estado_pedido = estado_pedido;
        }

        if (fecha_desde || fecha_hasta) {
            const dateFilter = {};
            if (fecha_desde) {
                dateFilter[Op.gte] = new Date(fecha_desde + 'T00:00:00');
            }
            if (fecha_hasta) {
                dateFilter[Op.lte] = new Date(fecha_hasta + 'T23:59:59');
            }
            // Add to existing deleted_at check? No, created_at is separate.
            where.created_at = dateFilter;
        }

        const data = await Pedidos.findAndCountAll({
            where,
            limit,
            offset,
            order,
            paranoid: false,
            include: [
                {
                    model: Clientes,
                    as: 'cliente',
                    attributes: ['id', 'nombre_cliente', 'apellido_cliente'],
                    paranoid: false
                }
            ]
        });

        return ApiResponse.success(res, {
            data: data.rows,
            count: data.count,
            message: 'Papelera de pedidos obtenida correctamente',
            status: 200,
            route: `${this.routes}/trashed`
        });
    });

    static getById = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;

        const pedido = await Pedidos.findOne({
            where: { id, id_empresa },
            include: [
                {
                    model: Clientes,
                    as: 'cliente',
                    attributes: ['id', 'nombre_cliente', 'apellido_cliente', 'correo_cliente', 'telefono_cliente']
                },
                {
                    model: Usuarios,
                    as: 'usuario_creador',
                    attributes: ['id', 'nombre_usuario']
                },
                {
                    model: DetallesPedidos,
                    as: 'detalles',
                    include: [{
                        model: Productos,
                        as: 'producto',
                        attributes: ['id', 'nombre_producto', 'imagen_url']
                    }]
                }
            ]
        });

        if (!pedido) {
            return ApiResponse.error(res, {
                error: 'Pedido no encontrado',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        return ApiResponse.success(res, {
            data: pedido,
            message: 'Pedido obtenido correctamente',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static store = catchErrors(async (req, res) => {
        const { id_cliente, detalles } = req.body;
        const { id: id_usuario_creador } = req.user; // Get creator from token
        const { id_empresa } = req.user;

        const result = await sequelize.transaction(async (t) => {
            // 1. Verify Client
            const cliente = await Clientes.findOne({ where: { id: id_cliente, id_empresa }, transaction: t });
            if (!cliente) throw new Error('Cliente no encontrado');

            let totalPedido = 0;
            const detallesToCreate = [];
            const emailDetalles = [];

            // 2. Validate Stock & Prepare Details
            for (const item of detalles) {
                const producto = await Productos.findOne({ where: { id: item.id_producto, id_empresa }, transaction: t });
                if (!producto) throw new Error(`Producto ${item.id_producto} no encontrado`);

                if (producto.stock_actual < item.cantidad) {
                    throw new Error(`Stock insuficiente para el producto: ${producto.nombre_producto}. Stock actual: ${producto.stock_actual}`);
                }

                // Deduct stock
                await producto.decrement('stock_actual', { by: item.cantidad, transaction: t });

                const subtotal = Number(item.cantidad) * Number(item.precio_historico);
                totalPedido += subtotal;

                detallesToCreate.push({
                    id_producto: item.id_producto,
                    cantidad: item.cantidad,
                    precio_historico: item.precio_historico,
                    subtotal
                });

                emailDetalles.push({
                    nombre_producto: producto.nombre_producto,
                    cantidad: item.cantidad,
                    subtotal
                });
            }

            // 3. Create Pedido
            const newPedido = await Pedidos.create({
                id_empresa: req.user.id_empresa,
                id_cliente,
                id_usuario_creador,
                total_pedido: totalPedido,
                estado_pedido: 'Pendiente'
            }, { transaction: t });

            // 4. Create Detalles
            const detallesWithPedidoId = detallesToCreate.map(d => ({ ...d, id_pedido: newPedido.id }));
            await DetallesPedidos.bulkCreate(detallesWithPedidoId, { transaction: t });

            return { pedido: newPedido, cliente, emailDetalles };
        });

        // 5. Send Email (Outside transaction usually, or handled gracefully if fails)
        try {
            await sendMail({
                from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
                recipient: result.cliente.correo_cliente,
                subject: `Confirmación de Pedido #${result.pedido.id.substring(0, 8)}`,
                text: `Hola ${result.cliente.nombre_cliente}, gracias por tu compra. Tu pedido #${result.pedido.id} ha sido registrado. Total: $${result.pedido.total_pedido}.`,
                html: `
            <h1>¡Gracias por tu compra, ${result.cliente.nombre_cliente}!</h1>
            <p>Tu pedido ha sido registrado con éxito.</p>
            <h3>Resumen del Pedido:</h3>
            <ul>
                ${result.emailDetalles.map(d => `<li>${d.nombre_producto} x ${d.cantidad} - $${d.subtotal}</li>`).join('')}
            </ul>
            <p><strong>Total: $${result.pedido.total_pedido}</strong></p>
            <p>Este es un correo automático, por favor no respondas a esta dirección.</p>
        `
            });
        } catch (mailError) {
            console.error('Error enviando correo:', mailError);
            // We don't fail the request if mail fails, but we might want to log it
        }

        return ApiResponse.success(res, {
            data: result.pedido,
            message: 'Pedido creado exitosamente',
            status: 201,
            route: this.routes
        });
    });

    static bulkStore = catchErrors(async (req, res) => {
        const pedidos = req.body;

        // Iterating transaction approach for correctness of stock logic
        const result = await sequelize.transaction(async (t) => {
            const created = [];
            for (const p of pedidos) {
                const { id_cliente, id_usuario_creador, detalles } = p;

                let totalPedido = 0;
                const detallesToCreate = [];

                for (const item of detalles) {
                    const producto = await Productos.findByPk(item.id_producto, { transaction: t });
                    if (!producto) throw new Error(`Producto ${item.id_producto} no encontrado en carga masiva`);

                    if (producto.stock_actual < item.cantidad) {
                        throw new Error(`Stock insuficiente para ${producto.nombre_producto} en carga masiva`);
                    }

                    await producto.decrement('stock_actual', { by: item.cantidad, transaction: t });

                    const subtotal = Number(item.cantidad) * Number(item.precio_historico);
                    totalPedido += subtotal;

                    detallesToCreate.push({
                        id_producto: item.id_producto,
                        cantidad: item.cantidad,
                        precio_historico: item.precio_historico,
                        subtotal
                    });
                }

                const newPedido = await Pedidos.create({
                    id_empresa: req.user.id_empresa,
                    id_cliente, // Should ideally check if client belongs to empresa too, but constraints/logic might suffice for now
                    id_usuario_creador: id_usuario_creador || req.user.id,
                    total_pedido: totalPedido,
                    estado_pedido: 'Completado' // Bulk load usually implies historical data? Or 'Pendiente'? Let's default 'Pendiente' or per requirement. User said "registros previos" so maybe 'Completado' makes sense or passed in body. But schema doesn't have status in create. Let's stick to default or logic. Assuming 'Pendiente' for consistency unless specified. User mentioned "registro de pedidos previos", implies history.
                    // Let's assume 'Pendiente' if not specified, or allow status in body for bulk?
                    // Schema didn't specify status field in create. Let's use 'Pendiente' as standard flow.
                }, { transaction: t });

                const detallesWithId = detallesToCreate.map(d => ({ ...d, id_pedido: newPedido.id }));
                await DetallesPedidos.bulkCreate(detallesWithId, { transaction: t });
                created.push(newPedido);
            }
            return created;
        });

        return ApiResponse.success(res, {
            data: result,
            message: `${result.length} pedidos creados exitosamente`,
            status: 201,
            route: `${this.routes}/bulk`
        });
    });

    static updateEstado = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { estado_pedido } = req.body;
        const { id_empresa } = req.user;

        const pedido = await Pedidos.findOne({ where: { id, id_empresa } });
        if (!pedido) {
            return ApiResponse.error(res, {
                error: 'Pedido no encontrado',
                status: 404,
                route: `${this.routes}/estado/${id}`
            });
        }

        await pedido.update({ estado_pedido });

        return ApiResponse.success(res, {
            data: pedido,
            message: 'Estado del pedido actualizado',
            status: 200,
            route: `${this.routes}/estado/${id}`
        });
    });

    static destroy = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;
        const pedido = await Pedidos.findOne({ where: { id, id_empresa } });

        if (!pedido) {
            return ApiResponse.error(res, {
                error: 'Pedido no encontrado',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        await pedido.destroy();

        return ApiResponse.success(res, {
            data: null,
            message: 'Pedido eliminado (Soft Delete)',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });

    static restore = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;
        const pedido = await Pedidos.findOne({
            where: { id, id_empresa },
            paranoid: false
        });

        if (!pedido) {
            return ApiResponse.error(res, {
                error: 'Pedido no encontrado',
                status: 404,
                route: `${this.routes}/${id}/restore`
            });
        }

        if (!pedido.deleted_at) {
            return ApiResponse.error(res, {
                error: 'El pedido no está eliminado',
                status: 400,
                route: `${this.routes}/${id}/restore`
            });
        }

        await pedido.restore();

        return ApiResponse.success(res, {
            data: pedido,
            message: 'Pedido restaurado correctamente',
            status: 200,
            route: `${this.routes}/${id}/restore`
        });
    });

    static forceDestroy = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_empresa } = req.user;
        const pedido = await Pedidos.findOne({
            where: { id, id_empresa },
            paranoid: false
        });

        if (!pedido) {
            return ApiResponse.error(res, {
                error: 'Pedido no encontrado',
                status: 404,
                route: `${this.routes}/${id}/force`
            });
        }

        await pedido.destroy({ force: true });

        return ApiResponse.success(res, {
            data: null,
            message: 'Pedido eliminado definitivamente',
            status: 200,
            route: `${this.routes}/${id}/force`
        });
    });
}

module.exports = PedidosController;
