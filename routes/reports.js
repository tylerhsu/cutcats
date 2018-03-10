const express = require('express');
const router = express.Router();
const models = require('../models');
const error = require('./util/error');
const csv = require('csv');
const moment = require('moment');

router.get('/payroll', getPayroll);
router.get('/invoice', getInvoice);

function getPayroll(req, res, next) {
    const { fromDate, toDate } = parseDates(req.query);
    const filename = getFilename('payroll', fromDate, toDate);

    if (isNaN(fromDate.valueOf())) {
        return next(error('Start date is not a recognizable date', 400));
    }

    if (isNaN(toDate.valueOf())) {
        return next(error('End date is not a recognizable date', 400));
    }

    let query = models.Job.aggregate()
        .match({
            readyTime: {
                $gte: fromDate,
                $lt: toDate
            }
        })
        .lookup({
            from: 'couriers',
            localField: 'courier',
            foreignField: '_id',
            as: 'courier'
        })
        .group({
            _id: { courier: { $arrayElemAt: ['$courier', 0] } },
            jobCount: { $sum: 1 },
            balance: { $sum: { $multiply: ['$billableTotal', .1] } }
        });

    res.set({
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename=' + filename
    });

    query
        .cursor()
        .exec()
        .on('error', next)
        .pipe(csv.transform(transform))
        .on('error', next)
        .pipe(csv.stringify({
            header: true
        }))
        .on('error', next)
        .pipe(res)
        .on('error', next);
    
    function transform(jobsByCourier, callback) {
        callback(null, {
            'Courier name': jobsByCourier._id.courier.name,
            'Jobs completed': jobsByCourier.jobCount,
            'Amount owed': precisionRound(jobsByCourier.balance, 2)
        });
    }
}

function getInvoice(req, res, next) {
    const { fromDate, toDate } = parseDates(req.query);
    const filename = getFilename('invoice', fromDate, toDate);

    if (isNaN(fromDate.valueOf())) {
        return next(error('Start date is not a recognizable date', 400));
    }

    if (isNaN(toDate.valueOf())) {
        return next(error('End date is not a recognizable date', 400));
    }
    
    let query = models.Job.aggregate()
        .match({
            readyTime: {
                $gte: fromDate,
                $lte: toDate
            }
        })
        .lookup({
            from: 'clients',
            localField: 'client',
            foreignField: '_id',
            as: 'client'
        })
        .group({
            _id: { client: { $arrayElemAt: ['$client', 0] } },
            jobCount: { $sum: 1 },
            balance: { $sum: '$billableTotal' }
        });

    res.set({
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename=' + filename
    });

    query
        .cursor()
        .exec()
        .on('error', next)
        .pipe(csv.transform(transform))
        .on('error', next)
        .pipe(csv.stringify({
            header: true
        }))
        .on('error', next)
        .pipe(res)
        .on('error', next);
    
    function transform(jobsByClient, callback) {
        callback(null, {
            'Client name': jobsByClient._id.client.name,
            'Jobs completed': jobsByClient.jobCount,
            'Billable total': precisionRound(jobsByClient.balance, 2)
        });
    }
}

function precisionRound(number, precision) {
    var factor = Math.pow(10, precision);
    return Math.round(number * factor) / factor;
}

function parseDates(query) {
    let fromDateNumber = parseInt(query.from);
    let toDateNumber = parseInt(query.to);
    let fromDate = new Date(fromDateNumber || query.from );
    let toDate = new Date(toDateNumber || query.to);

    if (fromDate.getDate() === toDate.getDate()) {
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

module.exports = router;
module.exports.getPayroll = getPayroll;
module.exports.getInvoice = getInvoice;
