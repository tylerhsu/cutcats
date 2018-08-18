const PdfMake = require('pdfmake');
const fonts = require('./fonts');

function createPdf(docDefinition) {
  const pdfMake = new PdfMake({
    OpenSans: fonts.OpenSans
  });
  
  return pdfMake.createPdfKitDocument({
    ...docDefinition,
    defaultStyle: {
      font: 'OpenSans',
      fontSize: 12
    }
  });
}

module.exports = { createPdf };
