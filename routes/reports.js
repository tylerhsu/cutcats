const express = require('express');
const router = express.Router();
const models = require('../models');
const error = require('./util/error');
const csv = require('csv');
const moment = require('moment');

router.get('/payroll', getPayroll);
router.get('/invoice', getInvoice);

function getPayroll(req, res, next) {
    const fromDate = new Date(req.query.from);
    const toDate = new Date(req.query.to);
    const filename = [
        'payroll',
        moment(fromDate).format('M-D-YYYY'),
        moment(toDate).format('M-D-YYYY')
    ].join('_') + '.csv';

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
    const fromDate = new Date(req.query.from);
    const toDate = new Date(req.query.to);
    const filename = [
        'invoice',
        moment(fromDate).format('M-D-YYYY'),
        moment(toDate).format('M-D-YYYY')
    ].join('_') + '.csv';

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

module.exports = router;
module.exports.getPayroll = getPayroll;
module.exports.getInvoice = getInvoice;
