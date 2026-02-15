const { createPdfStream } = require('./pdfGenerator');

const generateInvoiceDefinition = (pedido, companyData = null) => {
    const detallesBody = [
        [
            { text: 'Producto', style: 'tableHeader', fillColor: '#3B82F6', color: 'white', bold: true },
            { text: 'Cant', style: 'tableHeader', fillColor: '#3B82F6', color: 'white', bold: true },
            { text: 'Precio Unit.', style: 'tableHeader', fillColor: '#3B82F6', color: 'white', bold: true },
            { text: 'Subtotal', style: 'tableHeader', fillColor: '#3B82F6', color: 'white', bold: true }
        ]
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
        { text: 'TOTAL', colSpan: 3, bold: true, alignment: 'right', fillColor: '#F8FAFC' },
        {}, {},
        { text: `$${pedido.total_pedido}`, bold: true, fillColor: '#F8FAFC' }
    ]);

    // Build Header
    const headerColumns = [];

    // Left: Logo if available
    if (companyData && companyData.logoBase64) {
        headerColumns.push({
            image: `data:image/png;base64,${companyData.logoBase64}`,
            width: 80,
            margin: [0, 0, 20, 0]
        });
    }

    // Right: Company Info + Invoice Title
    const companyInfoParams = [];
    if (companyData) {
        companyInfoParams.push({ text: companyData.nombre_empresa || 'Nexus VCI', fontSize: 16, bold: true, color: '#1E293B' });
        if (companyData.nit_empresa) companyInfoParams.push({ text: `NIT: ${companyData.nit_empresa}`, fontSize: 10, color: '#64748B' });
        if (companyData.direccion_empresa) companyInfoParams.push({ text: companyData.direccion_empresa, fontSize: 10, color: '#64748B' });
    } else {
        companyInfoParams.push({ text: 'Nexus VCI', fontSize: 16, bold: true, color: '#1E293B' });
    }

    // Invoice Title Block
    const titleBlock = [
        ...companyInfoParams,
        { text: 'FACTURA DE COMPRA', style: 'header', alignment: 'right', margin: [0, 10, 0, 0], color: '#3B82F6' },
        { text: `Pedido #${pedido.id.substring(0, 8)}`, bold: true, alignment: 'right', fontSize: 12 },
        { text: `Fecha: ${new Date(pedido.created_at).toLocaleDateString()}`, alignment: 'right', fontSize: 10 }
    ];

    headerColumns.push({
        stack: titleBlock,
        alignment: 'right'
    });

    return {
        content: [
            {
                columns: headerColumns,
                margin: [0, 0, 0, 20]
            },
            { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 2, lineColor: '#E2E8F0' }], margin: [0, 0, 0, 20] },
            {
                columns: [
                    [
                        { text: 'CLIENTE', fontSize: 10, bold: true, color: '#64748B', margin: [0, 0, 0, 2] },
                        { text: `${pedido.cliente.nombre_cliente} ${pedido.cliente.apellido_cliente}`, bold: true, fontSize: 12, color: '#1E293B' },
                        { text: `DUI: ${pedido.cliente.dui_cliente || 'N/A'}`, fontSize: 10, color: '#475569' },
                        { text: `Correo: ${pedido.cliente.correo_cliente}`, fontSize: 10, color: '#475569' }
                    ],
                    [
                        { text: 'ESTADO', fontSize: 10, bold: true, color: '#64748B', margin: [0, 0, 0, 2], alignment: 'right' },
                        { text: pedido.estado_pedido.toUpperCase(), bold: true, fontSize: 12, color: pedido.estado_pedido === 'Completado' ? '#10B981' : '#F59E0B', alignment: 'right' }
                    ]
                ]
            },
            { text: ' ', margin: [0, 15] },
            {
                table: {
                    headerRows: 1,
                    widths: ['*', 'auto', 'auto', 'auto'],
                    body: detallesBody
                },
                layout: {
                    hLineWidth: function (i, node) {
                        return (i === 0 || i === node.table.body.length) ? 0 : 1;
                    },
                    vLineWidth: function (i, node) {
                        return 0;
                    },
                    hLineColor: function (i, node) {
                        return '#E2E8F0';
                    },
                    paddingLeft: function (i, node) { return 10; },
                    paddingRight: function (i, node) { return 10; },
                    paddingTop: function (i, node) { return 10; },
                    paddingBottom: function (i, node) { return 10; }
                }
            },
            {
                text: 'Gracias por su compra',
                style: 'small',
                alignment: 'center',
                margin: [0, 40],
                color: '#94A3B8'
            }
        ],
        styles: {
            header: { fontSize: 18, bold: true },
            tableHeader: { fontSize: 10, bold: true },
            small: { fontSize: 8 }
        },
        defaultStyle: {
            font: 'Roboto'
        }
    };
};

const generateInvoicePdfBuffer = async (pedido, companyData = null) => {
    const docDefinition = generateInvoiceDefinition(pedido, companyData);
    const pdfStream = await createPdfStream(docDefinition);

    return new Promise((resolve, reject) => {
        const chunks = [];
        pdfStream.on('data', chunk => chunks.push(chunk));
        pdfStream.on('end', () => resolve(Buffer.concat(chunks)));
        pdfStream.on('error', err => reject(err));
        pdfStream.end();
    });
};

module.exports = {
    generateInvoiceDefinition,
    generateInvoicePdfBuffer
};
