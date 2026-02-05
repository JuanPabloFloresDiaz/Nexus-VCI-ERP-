const { Pedidos, DetallesPedidos, Productos, Clientes, Categorias, Subcategorias, Filtros, OpcionesFiltro, sequelize } = require('../models');
const { Op } = require('sequelize');
const catchErrors = require('../utils/tryCatch');
const { createPdfStream } = require('../utils/pdfGenerator');
const exceljs = require('exceljs');

class ReportesController {

    // 1. Reporte de Categorización Completa
    static getCategorizacionReport = catchErrors(async (req, res) => {
        const categorias = await Categorias.findAll({
            include: [{
                model: Subcategorias,
                as: 'subcategorias',
                include: [{
                    model: Filtros,
                    as: 'filtros',
                    include: [{
                        model: OpcionesFiltro,
                        as: 'opciones'
                    }]
                }]
            }],
            order: [['nombre_categoria', 'ASC']]
        });

        const docDefinition = {
            content: [
                { text: 'Reporte de Categorización', style: 'header' },
                { text: `Generado el: ${new Date().toLocaleString()}`, style: 'small', margin: [0, 0, 0, 20] },
                ...categorias.map(cat => ([
                    { text: cat.nombre_categoria, style: 'subheader', margin: [0, 10, 0, 5] },
                    { text: cat.descripcion_categoria || 'Sin descripción', margin: [0, 0, 0, 5], fontSize: 10, italics: true },
                    {
                        ul: cat.subcategorias.map(sub => ({
                            text: [
                                { text: sub.nombre_subcategoria, bold: true },
                                sub.filtros.length > 0 ? {
                                    text: ` (Filtros: ${sub.filtros.map(f => `${f.nombre_filtro} [${f.opciones.length}]`).join(', ')})`,
                                    color: 'gray', fontSize: 9
                                } : ''
                            ],
                            margin: [0, 2, 0, 2]
                        }))
                    },
                    { text: '', margin: [0, 0, 0, 10] } // Spacer
                ])).flat()
            ]
        };

        const pdfStream = await createPdfStream(docDefinition);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=reporte-categorizacion.pdf');
        pdfStream.pipe(res);
        pdfStream.end();
    });

    // 2. Reporte de Productos (General o por Categoría)
    static getProductosReport = catchErrors(async (req, res) => {
        const { id_categoria } = req.query;

        let whereSub = {};
        let title = 'Reporte General de Productos';

        if (id_categoria) {
            whereSub.id_categoria = id_categoria;
            const cat = await Categorias.findByPk(id_categoria);
            if (cat) title = `Reporte de Productos - Categoría: ${cat.nombre_categoria}`;
        }

        const productos = await Productos.findAll({
            include: [{
                model: Subcategorias,
                as: 'subcategoria',
                where: id_categoria ? whereSub : undefined,
                include: [{ model: Categorias, as: 'categoria', attributes: ['nombre_categoria'] }]
            }],
            order: [
                [sequelize.literal('`subcategoria.categoria.nombre_categoria`'), 'ASC'], // Only works if direct include, might need nesting check
                ['nombre_producto', 'ASC']
            ]
        });

        const bodyData = [
            ['Producto', 'Categoría', 'Subcategoría', 'Precio', 'Stock']
        ];

        productos.forEach(p => {
            bodyData.push([
                p.nombre_producto,
                p.subcategoria?.categoria?.nombre_categoria || 'N/A',
                p.subcategoria?.nombre_subcategoria || 'N/A',
                `$${p.precio_unitario}`,
                p.stock_actual.toString()
            ]);
        });

        const docDefinition = {
            content: [
                { text: title, style: 'header' },
                { text: `Total Productos: ${productos.length}`, margin: [0, 0, 0, 10] },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto', 'auto'],
                        body: bodyData
                    }
                }
            ]
        };

        const pdfStream = await createPdfStream(docDefinition);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=reporte-productos.pdf');
        pdfStream.pipe(res);
        pdfStream.end();
    });

    // 3. Reporte de Clientes
    static getClientesReport = catchErrors(async (req, res) => {
        const clientes = await Clientes.findAll({
            include: [{
                model: Pedidos,
                as: 'pedidos',
                attributes: ['id']
            }],
            order: [['apellido_cliente', 'ASC']]
        });

        const bodyData = [
            ['Nombre', 'Correo', 'Teléfono', 'Pedidos']
        ];

        clientes.forEach(c => {
            bodyData.push([
                `${c.nombre_cliente} ${c.apellido_cliente}`,
                c.correo_cliente,
                c.telefono_cliente || 'N/A',
                c.pedidos.length.toString()
            ]);
        });

        const docDefinition = {
            content: [
                { text: 'Reporte de Clientes', style: 'header' },
                { text: `Total Clientes Registrados: ${clientes.length}`, margin: [0, 0, 0, 10] },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto'],
                        body: bodyData
                    }
                }
            ]
        };

        const pdfStream = await createPdfStream(docDefinition);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=reporte-clientes.pdf');
        pdfStream.pipe(res);
        pdfStream.end();
    });

    // 4. Reporte Bitácora de Pedidos (Filtrado por fecha/hora)
    static getPedidosLogReport = catchErrors(async (req, res) => {
        const { startDate, endDate } = req.query;
        let subTitle = 'Histórico Completo';

        const where = {};
        if (startDate && endDate) {
            where.created_at = { [Op.between]: [startDate, endDate] };
            subTitle = `Desde: ${startDate} Hasta: ${endDate}`;
        }

        const pedidos = await Pedidos.findAll({
            where,
            include: [{
                model: Clientes,
                as: 'cliente',
                attributes: ['nombre_cliente', 'apellido_cliente']
            }],
            order: [['created_at', 'DESC']]
        });

        const bodyData = [
            ['ID', 'Fecha', 'Cliente', 'Total', 'Estado']
        ];

        pedidos.forEach(p => {
            const fecha = new Date(p.created_at).toLocaleString();
            bodyData.push([
                p.id.substring(0, 8),
                fecha,
                p.cliente ? `${p.cliente.nombre_cliente} ${p.cliente.apellido_cliente}` : 'Anon',
                `$${p.total_pedido}`,
                p.estado_pedido
            ]);
        });

        const docDefinition = {
            content: [
                { text: 'Bitácora de Pedidos', style: 'header' },
                { text: subTitle, margin: [0, 0, 0, 10], italics: true },
                {
                    table: {
                        headerRows: 1,
                        widths: ['auto', 'auto', '*', 'auto', 'auto'],
                        body: bodyData
                    }
                }
            ]
        };

        const pdfStream = await createPdfStream(docDefinition);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=bitacora-pedidos.pdf');
        pdfStream.pipe(res);
        pdfStream.end();
    });

    // 5. Factura de Pedido
    static getFacturaPedido = catchErrors(async (req, res) => {
        const { id } = req.params;
        const pedido = await Pedidos.findByPk(id, {
            include: [
                { model: Clientes, as: 'cliente' },
                {
                    model: DetallesPedidos,
                    as: 'detalles',
                    include: [{ model: Productos, as: 'producto' }]
                }
            ]
        });

        if (!pedido) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        const detallesBody = [
            [{ text: 'Producto', style: 'tableHeader' }, { text: 'Cant', style: 'tableHeader' }, { text: 'Precio Unit.', style: 'tableHeader' }, { text: 'Subtotal', style: 'tableHeader' }]
        ];

        pedido.detalles.forEach(d => {
            detallesBody.push([
                d.producto?.nombre_producto || 'Producto Eliminado',
                d.cantidad.toString(),
                `$${d.precio_historico}`,
                `$${d.subtotal}`
            ]);
        });

        // Totals row
        detallesBody.push([
            { text: 'TOTAL', colSpan: 3, bold: true, alignment: 'right' },
            {}, {},
            { text: `$${pedido.total_pedido}`, bold: true }
        ]);

        const docDefinition = {
            content: [
                { text: 'FACTURA DE COMPRA', style: 'header', alignment: 'center', margin: [0, 0, 0, 20] },
                {
                    columns: [
                        [
                            { text: 'Cliente:', bold: true },
                            { text: `${pedido.cliente.nombre_cliente} ${pedido.cliente.apellido_cliente}` },
                            { text: `DUI: ${pedido.cliente.dui_cliente || 'N/A'}` },
                            { text: `Correo: ${pedido.cliente.correo_cliente}` }
                        ],
                        [
                            { text: `Pedido #${pedido.id.substring(0, 8)}`, bold: true, alignment: 'right' },
                            { text: `Fecha: ${new Date(pedido.created_at).toLocaleDateString()}`, alignment: 'right' },
                            { text: `Estado: ${pedido.estado_pedido}`, alignment: 'right' }
                        ]
                    ]
                },
                { text: ' ', margin: [0, 10] },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto'],
                        body: detallesBody
                    },
                    layout: 'lightHorizontalLines'
                },
                { text: 'Gracias por su compra', style: 'small', alignment: 'center', margin: [0, 30] }
            ]
        };

        const pdfStream = await createPdfStream(docDefinition);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=factura-${pedido.id}.pdf`);
        pdfStream.pipe(res);
        pdfStream.end();
    });

    // 6. Reporte Masivo de Pedidos (Excel)
    static getPedidosExcelReport = catchErrors(async (req, res) => {
        const { startDate, endDate } = req.query;
        const where = {};
        if (startDate && endDate) {
            where.created_at = { [Op.between]: [startDate, endDate] };
        }

        const pedidos = await Pedidos.findAll({
            where,
            include: [
                { model: Clientes, as: 'cliente', attributes: ['nombre_cliente', 'apellido_cliente', 'correo_cliente'] },
                { model: DetallesPedidos, as: 'detalles', include: [{ model: Productos, as: 'producto', attributes: ['nombre_producto'] }] }
            ],
            order: [['created_at', 'DESC']]
        });

        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet('Pedidos');

        worksheet.columns = [
            { header: 'ID Pedido', key: 'id', width: 36 },
            { header: 'Fecha', key: 'fecha', width: 20 },
            { header: 'Cliente', key: 'cliente', width: 30 },
            { header: 'Correo', key: 'correo', width: 30 },
            { header: 'Total', key: 'total', width: 15 },
            { header: 'Estado', key: 'estado', width: 15 },
            { header: 'Items', key: 'items', width: 50 } // Resumen de items
        ];

        pedidos.forEach(p => {
            const itemsStr = p.detalles.map(d => `${d.producto?.nombre_producto} (${d.cantidad})`).join(', ');
            worksheet.addRow({
                id: p.id,
                fecha: new Date(p.created_at).toLocaleString(),
                cliente: p.cliente ? `${p.cliente.nombre_cliente} ${p.cliente.apellido_cliente}` : 'Eliminado',
                correo: p.cliente?.correo_cliente || '',
                total: parseFloat(p.total_pedido),
                estado: p.estado_pedido,
                items: itemsStr
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=reporte-pedidos.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    });
}

module.exports = ReportesController;
