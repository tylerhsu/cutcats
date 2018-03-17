const moment = require('moment');

function precisionRound(number, precision) {
    var factor = Math.pow(10, precision);
    return Math.round(number * factor) / factor;
}

function parseDates(query) {
    let fromDate = query.from;
    let toDate = query.to;
    
    if (fromDate) {
        fromDate = new Date(parseInt(fromDate) || fromDate);
    }

    if (toDate) {
        toDate = new Date(parseInt(toDate) || toDate);
    }

    if (fromDate && toDate && fromDate.getDate() === toDate.getDate()) {
        fromDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate(), 0, 0, 0, 0);
        toDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate(), 23, 59, 59, 999);
    }
    
    return { fromDate, toDate };
}

function getFilename(prefix, fromDate, toDate) {
    const dateFormat = 'M-D-YYYY';
    const fromString = moment(fromDate).format(dateFormat);
    const toString = moment(toDate).format(dateFormat);
    return [
        prefix,
        (fromDate.getDate() === toDate.getDate() ?
            fromString :
            [fromString, toString].join('_')
        )
    ].join('_') + '.csv';
}

module.exports = {
    precisionRound,
    parseDates,
    getFilename
};
