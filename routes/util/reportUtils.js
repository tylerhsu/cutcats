const moment = require('moment');

function precisionRound (number, precision) {
  var factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}

function parseDate (dateString) {
  if (!dateString) {
    return null;
  }
  
  return new Date(parseInt(dateString) || dateString);
}

function getFilename (prefix, fromDate, toDate) {
  const dateRange = getDateRangeString(fromDate, toDate);
  return dateRange ?
    [prefix, dateRange].join('_') + '.csv' :
    prefix + '.csv';
}

function getDateRangeString(fromDate, toDate) {
  const dateFormat = 'M-D-YYYY';
  const fromString = fromDate ? moment(fromDate).format(dateFormat) : '';
  const toString = toDate ? moment(toDate).format(dateFormat) : '';
  if (fromDate && toDate) {
    return fromDate.getDate() === toDate.getDate() ?
      fromString :
      [fromString, toString].join('_');
  } else if (fromDate) {
    return fromString;
  } else if (toDate) {
    return toString;
  } else {
    return '';
  }
}

module.exports = {
  precisionRound,
  parseDate,
  getFilename
};
