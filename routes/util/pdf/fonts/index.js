const path = require('path');

const OpenSans = {
  normal: path.resolve(__dirname, './OpenSans-Regular.ttf'),
  bold: path.resolve(__dirname, './OpenSans-Bold.ttf'),
  italics: path.resolve(__dirname, './OpenSans-Italic.ttf'),
  bolditalics: path.resolve(
    __dirname,
    './OpenSans-BoldItalic.ttf',
  )
};

module.exports = { OpenSans };
