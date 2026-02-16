const { Pedidos, DetallesPedidos, Productos, ProductoVariantes, Clientes, Usuarios, ProductoDetallesFiltros, OpcionesFiltro, Filtros, sequelize } = require('../models');
const { Op } = require('sequelize');
const catchErrors = require('../utils/tryCatch');
const ApiResponse = require('../utils/apiResponse');
const getPaginatedQuery = require('../utils/getPaginatedQuery');
const { sendMail } = require('../utils/mail');

const { fetchCompanyData } = require('../utils/company.helper');

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
            distinct: true,
            include: [
                {
                    model: Clientes,
                    as: 'cliente',
                    attributes: ['id', 'nombre_cliente', 'apellido_cliente', 'correo_cliente', 'telefono_cliente', 'created_at', 'updated_at', 'deleted_at']
                },
                {
                    model: Usuarios,
                    as: 'usuario_creador',
                    attributes: ['id', 'nombre_usuario']
                },
                {
                    model: DetallesPedidos,
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
                            attributes: ['id', 'sku', 'imagen_url']
                        }
                    ]
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
                    include: [
                        {
                            model: Productos,
                            as: 'producto',
                            attributes: ['id', 'nombre_producto', 'imagen_url', 'stock_actual']
                        },
                        {
                            model: ProductoVariantes,
                            as: 'variante',
                            attributes: ['id', 'sku', 'imagen_url', 'stock_actual'],
                            include: [
                                {
                                    model: ProductoDetallesFiltros,
                                    as: 'detalles_filtros',
                                    include: [
                                        {
                                            model: OpcionesFiltro,
                                            as: 'opcion_filtro',
                                            include: [
                                                { model: Filtros, as: 'filtro' }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
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
        const { id_cliente, detalles, estado_pedido } = req.body;
        const { id, id_empresa } = req.user;
        const id_usuario_creador = id;

        const result = await sequelize.transaction(async (t) => {
            const cliente = await Clientes.findOne({
                where: { id: id_cliente, id_empresa },
                transaction: t
            });
            if (!cliente) throw new Error('Cliente no encontrado');

            let totalPedido = 0;
            const detallesToCreate = [];
            const emailDetalles = [];

            for (const item of detalles) {
                // item must now include id_variante
                const variant = await ProductoVariantes.findOne({
                    where: { id: item.id_variante },
                    include: [{ model: Productos, as: 'producto', where: { id_empresa } }],
                    transaction: t
                });

                if (!variant) throw new Error(`Variante ${item.id_variante} no encontrada`);

                if (variant.stock_actual < item.cantidad) {
                    throw new Error(`Stock insuficiente para: ${variant.producto.nombre_producto} (SKU: ${variant.sku})`);
                }

                await variant.decrement('stock_actual', {
                    by: item.cantidad,
                    transaction: t
                });

                const subtotal = Number(item.cantidad) * Number(item.precio_historico);
                totalPedido += subtotal;

                detallesToCreate.push({
                    id_producto: variant.id_producto,
                    id_variante: variant.id,
                    cantidad: item.cantidad,
                    precio_historico: item.precio_historico,
                    subtotal,
                    detalles_producto: item.detalles_producto
                });

                emailDetalles.push({
                    nombre_producto: variant.producto.nombre_producto + (variant.sku ? ` (${variant.sku})` : ''),
                    cantidad: item.cantidad,
                    subtotal
                });
            }

            const newPedido = await Pedidos.create({
                id_empresa: id_empresa,
                id_cliente: id_cliente,
                id_usuario_creador: id_usuario_creador,
                total_pedido: totalPedido,
                estado_pedido: estado_pedido || 'Pendiente'
            }, { transaction: t });

            const detallesWithPedidoId = detallesToCreate.map(d => ({
                ...d,
                id_pedido: newPedido.id
            }));

            await DetallesPedidos.bulkCreate(detallesWithPedidoId, { transaction: t });

            return { pedido: newPedido, cliente, emailDetalles };
        });

        try {
            const { generateInvoicePdfBuffer } = require('../utils/invoiceGenerator');

            // Fetch company data for branding (FIXED)
            const companyData = await fetchCompanyData(id_empresa);

            // Re-fetch full pedido with details for invoice generation
            const fullPedidoForInvoice = await Pedidos.findByPk(result.pedido.id, {
                include: [
                    { model: Clientes, as: 'cliente' },
                    {
                        model: DetallesPedidos,
                        as: 'detalles',
                        include: [
                            { model: Productos, as: 'producto' },
                            { model: ProductoVariantes, as: 'variante' }
                        ]
                    }
                ]
            });

            const pdfBuffer = await generateInvoicePdfBuffer(fullPedidoForInvoice, companyData); // Pass companyData

            await sendMail({
                from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
                recipient: result.cliente.correo_cliente,
                subject: `Confirmación de Pedido #${result.pedido.id.substring(0, 8)}`,
                text: `Pedido registrado. Total: ${result.pedido.total_pedido}`,
                html: `<h1>Pedido Registrado</h1><p>Total: ${result.pedido.total_pedido}</p><p>Adjunto encontrará su factura.</p>`,
                attachments: [
                    {
                        filename: `factura-${result.pedido.id.substring(0, 8)}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }
                ]
            });
        } catch (mailError) {
            console.error('Error enviando correo o generando factura:', mailError);
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
        const { id_empresa, id: id_usuario_actual } = req.user;

        const result = await sequelize.transaction(async (t) => {
            const created = [];
            const errors = [];

            for (const [index, p] of pedidos.entries()) {
                try {
                    const { cliente: clienteData, detalles, fecha_pedido, estado_pedido, id_cliente: providedIdCliente } = p;
                    let id_cliente = providedIdCliente;

                    // 1. Resolve Client
                    if (!id_cliente && clienteData) {
                        // Try to find by DUI (if provided)
                        if (clienteData.dui_cliente) {
                            const existingClient = await Clientes.findOne({
                                where: {
                                    id_empresa,
                                    dui_cliente: clienteData.dui_cliente
                                },
                                transaction: t
                            });
                            if (existingClient) id_cliente = existingClient.id;
                        }

                        // Try to find by Email (if not found by DUI)
                        if (!id_cliente && clienteData.correo_cliente) {
                            const existingClient = await Clientes.findOne({
                                where: {
                                    id_empresa,
                                    correo_cliente: clienteData.correo_cliente
                                },
                                transaction: t
                            });
                            if (existingClient) id_cliente = existingClient.id;
                        }

                        // Create if not found
                        if (!id_cliente) {
                            const newClient = await Clientes.create({
                                id_empresa,
                                nombre_cliente: clienteData.nombre_cliente,
                                apellido_cliente: clienteData.apellido_cliente,
                                dui_cliente: clienteData.dui_cliente,
                                correo_cliente: clienteData.correo_cliente,
                                telefono_cliente: clienteData.telefono_cliente
                            }, { transaction: t });
                            id_cliente = newClient.id;
                        }
                    }

                    if (!id_cliente) {
                        throw new Error(`Fila ${index + 1}: No se pudo identificar ni crear al cliente.`);
                    }

                    // 2. Process Details
                    let totalPedido = 0;
                    const detallesToCreate = [];

                    for (const item of detalles) {
                        // Find Variant by SKU
                        // Use include to ensure it belongs to the company
                        const variant = await ProductoVariantes.findOne({
                            where: { sku: item.sku },
                            include: [{ model: Productos, as: 'producto', where: { id_empresa } }],
                            transaction: t
                        });

                        if (!variant) {
                            throw new Error(`Fila ${index + 1}: SKU '${item.sku}' no encontrado.`);
                        }

                        // Stock Check (Deduct if requested, even for historical?
                        // User said: "Creating historical 'Completed' orders will still deduct stock from the current inventory.")
                        // Only deduct if status is NOT 'Cancelado' (assuming 'Pendiente' reserves stock too?)
                        // Usually Pendiente reserves, Completado deducts. Cancelado releases.
                        // Let's assume we deduct for Pendiente and Completado.

                        if (estado_pedido !== 'Cancelado') {
                            if (variant.stock_actual < item.cantidad) {
                                throw new Error(`Fila ${index + 1}: Stock insuficiente para SKU ${item.sku}. Existencia: ${variant.stock_actual}`);
                            }
                            await variant.decrement('stock_actual', { by: item.cantidad, transaction: t });
                        }

                        const subtotal = Number(item.cantidad) * Number(item.precio_historico);
                        totalPedido += subtotal;

                        detallesToCreate.push({
                            id_producto: variant.id_producto,
                            id_variante: variant.id,
                            cantidad: item.cantidad,
                            precio_historico: item.precio_historico,
                            subtotal,
                            detalles_producto: item.detalles_producto || {}
                        });
                    }

                    // 3. Create Order
                    const newPedido = await Pedidos.create({
                        id_empresa,
                        id_cliente,
                        id_usuario_creador: id_usuario_actual,
                        total_pedido: totalPedido,
                        estado_pedido: estado_pedido || 'Completado', // Default to Completed for historical imports? Or Pendiente? Plan said 'Pendiente' default in other places, but for bulk history 'Completado' makes sense. Let's use user input or default 'Pendiente'.
                        created_at: fecha_pedido ? new Date(fecha_pedido) : new Date() // Allow override
                    }, { transaction: t });

                    // 4. Bulk Create Details
                    const detallesWithId = detallesToCreate.map(d => ({ ...d, id_pedido: newPedido.id }));
                    await DetallesPedidos.bulkCreate(detallesWithId, { transaction: t });

                    created.push(newPedido);

                } catch (error) {
                    errors.push(error.message);
                    // Decide: Fail all or partial?
                    // Transaction wraps ALL, so if one fails, all fail.
                    throw error; // Rollback everything
                }
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

    static update = catchErrors(async (req, res) => {
        const { id } = req.params;
        const { id_cliente, detalles, estado_pedido } = req.body;
        const { id_empresa } = req.user;

        const result = await sequelize.transaction(async (t) => {
            // 1. Fetch original order
            const pedido = await Pedidos.findOne({
                where: { id, id_empresa },
                include: [{ model: DetallesPedidos, as: 'detalles' }],
                transaction: t
            });

            if (!pedido) throw new Error('Pedido no encontrado');

            if (pedido.estado_pedido === 'Completado' || pedido.estado_pedido === 'Cancelado') {
                if (pedido.estado_pedido === 'Completado') console.warn('Editing a completed order - stock logic handling required');
            }

            // 2. Restore Stock to VARIANTS for old items
            for (const detalle of pedido.detalles) {
                if (detalle.id_variante) {
                    await ProductoVariantes.increment('stock_actual', {
                        by: detalle.cantidad,
                        where: { id: detalle.id_variante },
                        transaction: t
                    });
                } else {
                    // Fallback if data was old (shouldn't happen with fresh DB, but for safety)
                    console.warn(`Legacy detail without id_variante found in order ${id}`);
                }
            }

            // 3. Delete old details
            await DetallesPedidos.destroy({
                where: { id_pedido: id },
                transaction: t
            });

            // 4. Process NEW details (Deduct Stock & Create)
            let totalPedido = 0;
            const detallesToCreate = [];
            const emailDetalles = [];

            for (const item of detalles) {
                // Fetch Variant
                const variant = await ProductoVariantes.findOne({
                    where: { id: item.id_variante },
                    include: [{ model: Productos, as: 'producto', where: { id_empresa } }],
                    transaction: t
                });

                if (!variant) throw new Error(`Variante ${item.id_variante} no encontrada`);

                if (variant.stock_actual < item.cantidad) {
                    throw new Error(`Stock insuficiente para: ${variant.producto.nombre_producto} (SKU: ${variant.sku})`);
                }

                await variant.decrement('stock_actual', {
                    by: item.cantidad,
                    transaction: t
                });

                const subtotal = Number(item.cantidad) * Number(item.precio_historico);
                totalPedido += subtotal;

                detallesToCreate.push({
                    id_pedido: id,
                    id_producto: variant.id_producto,
                    id_variante: variant.id,
                    cantidad: item.cantidad,
                    precio_historico: item.precio_historico,
                    subtotal,
                    detalles_producto: item.detalles_producto
                });

                emailDetalles.push({
                    nombre_producto: variant.producto.nombre_producto,
                    cantidad: item.cantidad,
                    subtotal
                });
            }

            // 5. Update Order Header
            await pedido.update({
                id_cliente,
                total_pedido: totalPedido,
                estado_pedido: estado_pedido || pedido.estado_pedido
            }, { transaction: t });

            // 6. Bulk Create New Details
            await DetallesPedidos.bulkCreate(detallesToCreate, { transaction: t });

            // Fetch updated client for email
            const cliente = await Clientes.findByPk(id_cliente, { transaction: t });

            return { pedido, cliente, emailDetalles };
        });

        // 7. Send Updated Invoice Email
        try {
            const { generateInvoicePdfBuffer } = require('../utils/invoiceGenerator');

            // Fetch company data for branding (FIXED)
            const companyData = await fetchCompanyData(id_empresa);

            const fullPedidoForInvoice = await Pedidos.findByPk(id, {
                include: [
                    { model: Clientes, as: 'cliente' },
                    {
                        model: DetallesPedidos,
                        as: 'detalles',
                        include: [
                            { model: Productos, as: 'producto' },
                            { model: ProductoVariantes, as: 'variante' }
                        ]
                    }
                ]
            });

            const pdfBuffer = await generateInvoicePdfBuffer(fullPedidoForInvoice, companyData); // Pass companyData

            await sendMail({
                from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
                recipient: result.cliente.correo_cliente,
                subject: `Actualización de Pedido #${result.pedido.id.substring(0, 8)}`,
                text: `Su pedido ha sido actualizado. Nuevo Total: ${result.pedido.total_pedido}`,
                html: `<h1>Pedido Actualizado</h1><p>El pedido ha sido modificado. Nuevo Total: ${result.pedido.total_pedido}</p><p>Adjunto encontrará su factura actualizada.</p>`,
                attachments: [
                    {
                        filename: `factura_actualizada-${result.pedido.id.substring(0, 8)}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }
                ]
            });
        } catch (mailError) {
            console.error('Error enviando correo de actualización:', mailError);
        }

        return ApiResponse.success(res, {
            data: result.pedido,
            message: 'Pedido actualizado exitosamente',
            status: 200,
            route: `${this.routes}/${id}`
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
};

module.exports = PedidosController;