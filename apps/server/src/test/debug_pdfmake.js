const pdfmake = require('pdfmake');
console.log('Type of pdfmake:', typeof pdfmake);
console.log('Is constructor?', pdfmake.prototype && pdfmake.prototype.constructor === pdfmake);
console.log('Keys:', Object.keys(pdfmake));
try {
    new pdfmake({});
    console.log('Instantiation successful');
} catch (e) {
    console.log('Instantiation failed:', e.message);
}
