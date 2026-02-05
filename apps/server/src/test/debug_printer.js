try {
    const PdfPrinterJS = require('pdfmake/js/Printer');
    console.log('Require js/Printer:', PdfPrinterJS);
    if (PdfPrinterJS.default) {
        console.log('Use .default from js/Printer');
        new PdfPrinterJS.default({ Roboto: { normal: 'Helvetica' } });
    } else {
        new PdfPrinterJS({ Roboto: { normal: 'Helvetica' } });
    }
} catch (e) {
    console.log('Error requiring js/Printer:', e.message);
}
