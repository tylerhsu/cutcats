'use strict';

const fonts = require('./fonts');
const PdfMake = require('pdfmake');
const pdfMake = new PdfMake({
  OpenSans: fonts.OpenSans
});

async function generatePdf (event) {
  return await new Promise((resolve, reject) => {
    const chunks = [];
    pdfMake.createPdfKitDocument({
      ...event,
      defaultStyle: {
        font: 'OpenSans',
        fontSize: 12
      }
    })
      .on('data', chunk => {
        chunks.push(chunk);
      })
      .on('end', () => {
        resolve(Buffer.concat(chunks));
      })
      .on('error', err => {
        reject(err);
      })
      .end();
  });
}

module.exports.generatePdf = generatePdf;
