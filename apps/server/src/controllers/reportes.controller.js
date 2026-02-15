const { Pedidos, DetallesPedidos, Productos, ProductoVariantes, ProductoDetallesFiltros, Clientes, Categorias, Subcategorias, Filtros, OpcionesFiltro, Empresas, sequelize } = require('../models');
const { Op } = require('sequelize');
const catchErrors = require('../utils/tryCatch');
const { createPdfStream } = require('../utils/pdfGenerator');
const exceljs = require('exceljs');
const { fetchCompanyData } = require('../utils/company.helper');

class ReportesController {

    // Helper to get company data and logo
    static async getCompanyData(req) {
        const { id_empresa, rol_usuario } = req.user;
        let targetIdEmpresa = id_empresa;

        // SuperAdmin can override id_empresa via query
        if (rol_usuario === 'SuperAdministrador' && req.query.id_empresa) {
            targetIdEmpresa = req.query.id_empresa;
        }

        if (!targetIdEmpresa && rol_usuario === 'SuperAdministrador') {
            return null; // Return null to indicate "All Companies" context
        }

        return await fetchCompanyData(targetIdEmpresa);
    }

    // Helper to build PDF Header
    static buildPdfHeader(companyData, title, subTitle = '') {
        const headerColumns = [];

        // Logo
        if (companyData && companyData.logoBase64) {
            headerColumns.push({
                image: `data:image/png;base64,${companyData.logoBase64}`,
                width: 60,
                margin: [0, 0, 15, 0]
            });
        }

        // Company Info
        const infoStack = [];
        if (companyData) {
            infoStack.push({ text: companyData.nombre_empresa, fontSize: 14, bold: true, color: '#1E293B' });
            if (companyData.nit_empresa) infoStack.push({ text: `NIT: ${companyData.nit_empresa}`, fontSize: 9, color: '#64748B' });
            if (companyData.direccion_empresa) infoStack.push({ text: companyData.direccion_empresa, fontSize: 9, color: '#64748B' });
        } else {
            infoStack.push({ text: 'Nexus VCI ERP', fontSize: 14, bold: true, color: '#1E293B' });
            infoStack.push({ text: 'Reporte General', fontSize: 9, color: '#64748B' });
        }

        headerColumns.push({ stack: infoStack });

        // Report Title & Date (Right aligned)
        headerColumns.push({
            stack: [
                { text: title, fontSize: 16, bold: true, alignment: 'right', color: '#3B82F6' },
                { text: subTitle, fontSize: 10, alignment: 'right', color: '#64748B', margin: [0, 5, 0, 0] },
                { text: `Generado: ${new Date().toLocaleString()}`, fontSize: 8, alignment: 'right', color: '#94A3B8', margin: [0, 2, 0, 0] }
            ],
            width: 'auto',
            alignment: 'right'
        });

        return [
            { columns: headerColumns, margin: [0, 0, 0, 20] },
            { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 2, lineColor: '#E2E8F0' }], margin: [0, 0, 0, 20] }
        ];
    }

    // 1. Reporte de Categorización Completa
    static getCategorizacionReport = catchErrors(async (req, res) => {
        const companyData = await ReportesController.getCompanyData(req);

        const where = {};
        if (companyData) {
            where.id_empresa = companyData.id;
        }

        const categorias = await Categorias.findAll({
            where,
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

        const header = ReportesController.buildPdfHeader(companyData, 'Reporte de Categorización');

        const docDefinition = {
            content: [
                ...header,
                ...categorias.map(cat => ([
                    { text: cat.nombre_categoria, style: 'subheader', color: '#1E293B', margin: [0, 10, 0, 2] },
                    { text: cat.descripcion_categoria || 'Sin descripción', margin: [0, 0, 0, 8], fontSize: 10, italics: true, color: '#64748B' },
                    {
                        ul: cat.subcategorias.map(sub => ({
                            text: [
                                { text: sub.nombre_subcategoria, bold: true, color: '#334155' },
                                (sub.filtros && sub.filtros.length > 0) ? {
                                    text: ` (Filtros: ${sub.filtros.map(f => `${f.nombre_filtro}`).join(', ')})`,
                                    color: '#94A3B8', fontSize: 9
                                } : ''
                            ],
                            margin: [0, 2, 0, 2],
                            listType: 'circle'
                        })),
                        margin: [10, 0, 0, 15]
                    },
                    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#F1F5F9', dash: { length: 2 } }] },
                    { text: ' ', margin: [0, 5] }
                ])).flat()
            ],
            styles: {
                subheader: { fontSize: 14, bold: true }
            }
        };

        const pdfStream = await createPdfStream(docDefinition);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=reporte-categorizacion.pdf');
        pdfStream.pipe(res);
        pdfStream.end();
    });

    // 2. Reporte de Productos
    // 2. Reporte de Productos
    static getProductosReport = catchErrors(async (req, res) => {
        const companyData = await ReportesController.getCompanyData(req);
        const { id_categoria } = req.query;

        const whereProducto = {};
        if (companyData) {
            whereProducto.id_empresa = companyData.id;
        }

        let whereSub = {};
        let title = 'Reporte General de Productos';

        if (id_categoria) {
            whereSub.id_categoria = id_categoria;
            const cat = await Categorias.findByPk(id_categoria);
            if (cat) title = `Productos: ${cat.nombre_categoria}`;
        }

        const productos = await Productos.findAll({
            where: whereProducto,
            include: [
                {
                    model: Subcategorias,
                    as: 'subcategoria',
                    where: id_categoria ? whereSub : undefined,
                    include: [{ model: Categorias, as: 'categoria', attributes: ['nombre_categoria'] }]
                },
                {
                    model: ProductoVariantes,
                    as: 'variantes',
                    include: [
                        {
                            model: ProductoDetallesFiltros,
                            as: 'detalles_filtros',
                            include: [
                                { model: OpcionesFiltro, as: 'opcion_filtro', include: [{ model: Filtros, as: 'filtro' }] }
                            ]
                        }
                    ]
                }
            ],
            order: [
                [sequelize.literal('`subcategoria.categoria.nombre_categoria`'), 'ASC'],
                ['nombre_producto', 'ASC']
            ]
        });

        const bodyData = [
            [
                { text: 'Producto / Variante', style: 'tableHeader', fillColor: '#3B82F6', color: 'white' },
                { text: 'Categoría', style: 'tableHeader', fillColor: '#3B82F6', color: 'white' },
                { text: 'Subcategoría', style: 'tableHeader', fillColor: '#3B82F6', color: 'white' },
                { text: 'Precio', style: 'tableHeader', fillColor: '#3B82F6', color: 'white' },
                { text: 'Stock', style: 'tableHeader', fillColor: '#3B82F6', color: 'white' }
            ]
        ];

        productos.forEach((p, index) => {
            const fillColor = index % 2 === 0 ? '#ffffff' : '#F8FAFC';

            // Product Header Row
            bodyData.push([
                { text: p.nombre_producto, fillColor, bold: true, colSpan: 5, color: '#1E293B' },
                {}, {}, {}, {}
            ]);

            if (p.variantes && p.variantes.length > 0) {
                p.variantes.forEach(v => {
                    // Compose attributes string (e.g., "Color: Rojo, Talla: M")
                    const attributes = v.detalles_filtros?.map(df =>
                        `${df.opcion_filtro?.filtro?.nombre_filtro}: ${df.opcion_filtro?.valor_opcion}`
                    ).join(', ') || 'Estándar';

                    bodyData.push([
                        { text: `  • SKU: ${v.sku || 'N/A'} - ${attributes}`, fillColor, fontSize: 9, color: '#475569' },
                        { text: p.subcategoria?.categoria?.nombre_categoria || 'N/A', fillColor, fontSize: 9 },
                        { text: p.subcategoria?.nombre_subcategoria || 'N/A', fillColor, fontSize: 9 },
                        { text: `$${v.precio_unitario}`, fillColor, fontSize: 9 },
                        { text: (v.stock_actual || 0).toString(), fillColor, fontSize: 9 }
                    ]);
                });
            } else {
                bodyData.push([
                    { text: '  • Sin variantes activas', fillColor, colSpan: 5, fontSize: 9, italics: true, color: '#94A3B8' },
                    {}, {}, {}, {}
                ]);
            }
        });

        const header = ReportesController.buildPdfHeader(companyData, title, `Total de Productos: ${productos.length}`);

        const docDefinition = {
            content: [
                ...header,
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto', 'auto'],
                        body: bodyData
                    },
                    layout: 'lightHorizontalLines'
                }
            ],
            styles: {
                tableHeader: { fontSize: 10, bold: true }
            }
        };

        const pdfStream = await createPdfStream(docDefinition);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=reporte-productos.pdf');
        pdfStream.pipe(res);
        pdfStream.end();
    });

    // 3. Reporte de Clientes
    static getClientesReport = catchErrors(async (req, res) => {
        const companyData = await ReportesController.getCompanyData(req);

        const where = {};
        if (companyData) {
            where.id_empresa = companyData.id;
        }

        const clientes = await Clientes.findAll({
            where,
            include: [{
                model: Pedidos,
                as: 'pedidos',
                attributes: ['id']
            }],
            order: [['apellido_cliente', 'ASC']]
        });

        const bodyData = [
            [
                { text: 'Nombre Completo', style: 'tableHeader', fillColor: '#3B82F6', color: 'white' },
                { text: 'Correo Electrónico', style: 'tableHeader', fillColor: '#3B82F6', color: 'white' },
                { text: 'Teléfono', style: 'tableHeader', fillColor: '#3B82F6', color: 'white' },
                { text: 'Pedidos', style: 'tableHeader', fillColor: '#3B82F6', color: 'white' }
            ]
        ];

        clientes.forEach((c, index) => {
            const fillColor = index % 2 === 0 ? '#ffffff' : '#F8FAFC';
            bodyData.push([
                { text: `${c.nombre_cliente} ${c.apellido_cliente}`, fillColor },
                { text: c.correo_cliente, fillColor },
                { text: c.telefono_cliente || 'N/A', fillColor },
                { text: c.pedidos.length.toString(), fillColor, alignment: 'center' }
            ]);
        });

        const header = ReportesController.buildPdfHeader(companyData, 'Reporte de Clientes', `Total Clientes: ${clientes.length}`);

        const docDefinition = {
            content: [
                ...header,
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto'],
                        body: bodyData
                    },
                    layout: 'lightHorizontalLines'
                }
            ],
            styles: {
                tableHeader: { fontSize: 10, bold: true }
            }
        };

        const pdfStream = await createPdfStream(docDefinition);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=reporte-clientes.pdf');
        pdfStream.pipe(res);
        pdfStream.end();
    });

    // 4. Reporte Bitácora de Pedidos
    // 4. Reporte Bitácora de Pedidos
    static getPedidosLogReport = catchErrors(async (req, res) => {
        const companyData = await ReportesController.getCompanyData(req);
        const { startDate, endDate } = req.query;

        const where = {};
        if (companyData) {
            where.id_empresa = companyData.id;
        }

        let subTitle = 'Histórico Completo';
        if (startDate && endDate) {
            where.created_at = { [Op.between]: [startDate, endDate] };
            subTitle = `Desde: ${startDate} Hasta: ${endDate}`;
        }

        const pedidos = await Pedidos.findAll({
            where,
            include: [
                { model: Clientes, as: 'cliente', attributes: ['nombre_cliente', 'apellido_cliente'] },
                {
                    model: DetallesPedidos,
                    as: 'detalles',
                    include: [
                        { model: Productos, as: 'producto', attributes: ['nombre_producto'] },
                        { model: ProductoVariantes, as: 'variante', attributes: ['sku'] }
                    ]
                }
            ],
            order: [['created_at', 'DESC']]
        });

        const bodyData = [
            [
                { text: 'ID / Items', style: 'tableHeader', fillColor: '#3B82F6', color: 'white' },
                { text: 'Fecha', style: 'tableHeader', fillColor: '#3B82F6', color: 'white' },
                { text: 'Cliente', style: 'tableHeader', fillColor: '#3B82F6', color: 'white' },
                { text: 'Total', style: 'tableHeader', fillColor: '#3B82F6', color: 'white' },
                { text: 'Estado', style: 'tableHeader', fillColor: '#3B82F6', color: 'white' }
            ]
        ];

        pedidos.forEach((p, index) => {
            const fecha = new Date(p.created_at).toLocaleString();
            const fillColor = index % 2 === 0 ? '#ffffff' : '#F8FAFC';

            let statusColor = '#F59E0B'; // Pendiente
            if (p.estado_pedido === 'Completado') statusColor = '#10B981';
            if (p.estado_pedido === 'Cancelado') statusColor = '#E11D48';

            // Order Row
            bodyData.push([
                { text: p.id.substring(0, 8), fillColor, fontSize: 10, bold: true },
                { text: fecha, fillColor, fontSize: 10 },
                { text: p.cliente ? `${p.cliente.nombre_cliente} ${p.cliente.apellido_cliente}` : 'Anon', fillColor },
                { text: `$${p.total_pedido}`, fillColor, bold: true },
                { text: p.estado_pedido, fillColor, color: statusColor, bold: true }
            ]);

            // Item Details
            if (p.detalles && p.detalles.length > 0) {
                const itemsList = p.detalles.map(d =>
                    ` • ${d.producto?.nombre_producto || 'Producto Eliminado'} ${d.variante?.sku ? `(SKU: ${d.variante.sku})` : ''} x${d.cantidad} ($${d.subtotal})`
                ).join('\n');

                bodyData.push([
                    { text: itemsList, colSpan: 5, fontSize: 9, color: '#475569', fillColor, margin: [15, 2, 0, 8] },
                    {}, {}, {}, {}
                ]);
            }
        });

        const header = ReportesController.buildPdfHeader(companyData, 'Bitácora de Pedidos', subTitle);

        const docDefinition = {
            content: [
                ...header,
                {
                    table: {
                        headerRows: 1,
                        widths: ['auto', 'auto', '*', 'auto', 'auto'],
                        body: bodyData
                    },
                    layout: 'lightHorizontalLines'
                }
            ],
            styles: {
                tableHeader: { fontSize: 10, bold: true }
            }
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
        const { generateInvoiceDefinition } = require('../utils/invoiceGenerator');

        // We check company data mainly to ensure access rights (if user is admin of different company)
        // and to get logo for the invoice.
        const companyData = await ReportesController.getCompanyData(req);

        const where = { id };
        if (companyData) {
            // Ensure user can only download invoices from their company
            where.id_empresa = companyData.id;
        }

        const pedido = await Pedidos.findOne({
            where,
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
            return res.status(404).json({ error: 'Pedido no encontrado o acceso denegado' });
        }

        // Pass companyData to generator for branding
        const docDefinition = generateInvoiceDefinition(pedido, companyData);

        const pdfStream = await createPdfStream(docDefinition);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=factura-${pedido.id}.pdf`);
        pdfStream.pipe(res);
        pdfStream.end();
    });

    // 6. Reporte Masivo de Pedidos (Excel)
    static getPedidosExcelReport = catchErrors(async (req, res) => {
        const companyData = await ReportesController.getCompanyData(req);
        const { startDate, endDate } = req.query;

        const where = {};
        if (companyData) {
            where.id_empresa = companyData.id;
        }

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
            { header: 'Items', key: 'items', width: 50 },
            // Removed Enterprise ID column as requested
        ];

        // Header Style
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } };

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
