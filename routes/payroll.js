const express = require('express');
const router = express.Router();
const models = require('../models');
const error = require('./util/error');
const csv = require('csv');
const reportUtils = require('./util/reportUtils');

router.get('/', getPayroll);
router.get('/csv', getPayrollCsv);

function getPayroll (req, res, next) {
  return _getPayrollQuery(req).exec()
    .then(results => {
      res.json(results);
    })
    .catch(next);
}

function getPayrollCsv (req, res, next) {
  const { fromDate, toDate } = reportUtils.parseDates(req.query);
  const filename = reportUtils.getFilename('payroll', fromDate, toDate);
  res.set({
    'Content-Type': 'text/plain',
    'Content-Disposition': 'attachment; filename=' + filename
  });

  return _getPayrollQuery(req)
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

  function transform (ridesByCourier, callback) {
    callback(null, {
      'Courier name': ridesByCourier._id.courier.name,
      'Rides completed': ridesByCourier.rideCount,
      'Amount owed': reportUtils.precisionRound(ridesByCourier.balance, 2)
    });
  }
}

function _getPayrollQuery (req) {
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
      rideCount: { $sum: 1 },
      balance: { $sum: { $multiply: ['$billableTotal', 0.1] } }
    });
}

module.exports = router;
module.exports.getPayroll = getPayroll;
