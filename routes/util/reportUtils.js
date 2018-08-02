const moment = require('moment');

function precisionRound (number, precision) {
  var factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}

function parseDate (dateString) {
  return new Date(parseInt(dateString) || dateString);
}

function getFilename (prefix, fromDate, toDate) {
  const dateFormat = 'M-D-YYYY';
  const fromString = moment(fromDate).format(dateFormat);
  const toString = moment(toDate).format(dateFormat);
  return [
    prefix,
    (fromDate.getDate() === toDate.getDate()
      ? fromString
      : [fromString, toString].join('_')
    )
  ].join('_') + '.csv';
}

module.exports = {
  precisionRound,
  parseDate,
  getFilename
};
