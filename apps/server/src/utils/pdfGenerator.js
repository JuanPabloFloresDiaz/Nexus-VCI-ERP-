const PdfPrinter = require('pdfmake/js/Printer').default;
const path = require('path');

// Define fonts - we'll use Standard fonts for simplicity to avoid file management issues initially.
// Or we can try to point to local fonts if available.
// For now, let's map Roboto to Helvetica (Standard) to ensure it works out of the box without font files.
// If user wants real Roboto, we'd need to add .ttf files to a src/fonts folder.
const fonts = {
    Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
    }
    // To use real custom fonts:
    // Roboto: {
    //     normal: path.join(__dirname, '../../fonts/Roboto-Regular.ttf'),
    //     bold: path.join(__dirname, '../../fonts/Roboto-Medium.ttf'),
    //     italics: path.join(__dirname, '../../fonts/Roboto-Italic.ttf'),
    //     bolditalics: path.join(__dirname, '../../fonts/Roboto-MediumItalic.ttf')
    // }
};

const printer = new PdfPrinter(fonts);

/**
 * Generates a PDF document stream
 * @param {Object} docDefinition - JSON definition of the PDF content
 * @returns {PDFKit.PDFDocument} The PDF stream
 */
const createPdfStream = (docDefinition) => {
    // Default styles
    if (!docDefinition.defaultStyle) {
        docDefinition.defaultStyle = {
            font: 'Roboto', // Uses our mapped font
            fontSize: 10
        };
    }

    // Common styles
    if (!docDefinition.styles) {
        docDefinition.styles = {
            header: {
                fontSize: 18,
                bold: true,
                margin: [0, 0, 0, 10]
            },
            subheader: {
                fontSize: 14,
                bold: true,
                margin: [0, 10, 0, 5]
            },
            tableHeader: {
                bold: true,
                fontSize: 10,
                color: 'black',
                fillColor: '#eeeeee'
            },
            small: {
                fontSize: 8,
                color: 'gray'
            }
        };
    }

    return printer.createPdfKitDocument(docDefinition);
};

module.exports = {
    createPdfStream
};
