const { createPdfStream } = require('./pdfGenerator');

const generateInvoiceDefinition = (pedido) => {
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

    return {
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
};

const generateInvoicePdfBuffer = async (pedido) => {
    const docDefinition = generateInvoiceDefinition(pedido);
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
