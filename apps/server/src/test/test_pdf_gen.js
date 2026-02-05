const { createPdfStream } = require('../utils/pdfGenerator');
const fs = require('fs');

try {
    const docDefinition = {
        content: [
            { text: 'Test PDF', style: 'header' }
        ]
    };

    console.log('Attempting to create PDF stream...');
    // createPdfStream is async in this version of pdfmake
    createPdfStream(docDefinition).then(pdfStream => {
        const writeStream = fs.createWriteStream('test_output.pdf');
        pdfStream.pipe(writeStream);

        pdfStream.on('end', () => {
            console.log('PDF stream ended successfully.');
        });

        writeStream.on('finish', () => {
            console.log('PDF file written successfully.');
        });

        pdfStream.end();
    }).catch(err => {
        console.error('Promise failed:', err);
    });

} catch (e) {
    console.error('PDF Generation failed:', e);
    process.exit(1);
}
