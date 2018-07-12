const express = require('express');
const router = express.Router();
const models = require('../models');
const error = require('./util/error');
const csv = require('csv');
const moment = require('moment');
const reportUtils = require('./util/reportUtils')

router.get('/', getInvoices);
router.get('/csv', getInvoicesCsv);

function getInvoices(req, res, next) {
    return _getInvoicesQuery(req).exec()
        .then(results => {
            res.json(results);
        })
        .catch(next);
}

function getInvoicesCsv(req, res, next) {
    const { fromDate, toDate } = reportUtils.parseDates(req.query);
    const filename = reportUtils.getFilename('invoices', fromDate, toDate);
    res.set({
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename=' + filename
    });

    return _getInvoicesQuery(req)
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

    function transform(ridesByClient, callback) {
        callback(null, {
            'Client name': ridesByClient._id.client.name,
            'Rides completed': ridesByClient.rideCount,
            'Billable total': reportUtils.precisionRound(ridesByClient.balance, 2)
        });
    }
}

function _getInvoicesQuery(req, res, next) {
    const { fromDate, toDate } = reportUtils.parseDates(req.query);

    if (isNaN(fromDate.valueOf())) {
        throw error('Start date is not a recognizable date', 400);
    }

    if (isNaN(toDate.valueOf())) {
        throw error('End date is not a recognizable date', 400);
    }
    
    return models.Ride.aggregate()
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
            rideCount: { $sum: 1 },
            balance: { $sum: '$billableTotal' }
        });
}

module.exports = router;
