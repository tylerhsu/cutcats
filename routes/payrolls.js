const express = require('express');
const _ = require('lodash');
const path = require('path');
const yazl = require('yazl');
const moment = require('moment');
const router = express.Router();
const models = require('../models');
const boilerplate = require('./boilerplate');
const reportUtils = require('./util/reportUtils');
const CourierPaystub = require('./util/CourierPaystub');
const QuickbooksPayrollCredits = require('./util/QuickbooksPayrollCredits');
const QuickbooksPayrollDebits = require('./util/QuickbooksPayrollDebits');
const QuickbooksPayrollNonInvoicedIncome = require('./util/QuickbooksPayrollNonInvoicedIncome');
const error = require('./util/error');
const AWS = require('aws-sdk');
const formatDate = (date) => moment(date).format('M-D-YYYY');

router.get('/', getPayrolls);
router.post('/', boilerplate.create(models.Payroll));
router.get('/generate', generatePaystubs, createPayrollZip, servePayrollZip);
router.post('/generate', generatePaystubs, createPayrollZip, savePayrollZip(new AWS.S3()));
router.get('/:id', boilerplate.getOne(models.Payroll));
router.patch('/:id', boilerplate.update(models.Payroll));
router.delete('/:id', boilerplate.destroy(models.Payroll));
router.get('/:id/download', downloadPayroll(new AWS.S3()));

function getPayrolls (req, res, next) {
  const fromDate = reportUtils.parseDate(req.query.from);
  const toDate = reportUtils.parseDate(req.query.to);
  const query = boilerplate.list.getQuery(models.Payroll, req);

  if (fromDate) {
    query.where({ periodEnd: { $gte: fromDate } });
  }

  if (toDate) {
    query.where({ periodStart: { $lte: toDate } });
  }

  return boilerplate.list.respond(query, req, res, next);
}

function downloadPayroll(s3) {
  return (req, res, next) => {
    return boilerplate.getOne.getQuery(models.Payroll, req)
      .then(payroll => {
        res.set({
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename=${path.basename(payroll.filePath)}`
        });
        s3.getObject({
          Bucket: process.env.S3_BUCKET,
          Key: payroll.filePath
        })
          .createReadStream()
          .pipe(res);
      })
      .catch(next);
  };
}

function generatePaystubs (req, res, next) {
  const periodStart = reportUtils.parseDate(req.query.periodStart);
  const periodEnd = reportUtils.parseDate(req.query.periodEnd);
  
  if (isNaN(periodStart.valueOf())) {
    throw error('Start date is not a recognizable date', 400);
  }

  if (isNaN(periodEnd.valueOf())) {
    throw error('End date is not a recognizable date', 400);
  }

  return Promise.all([
    getRidesByCourier(periodStart, periodEnd),
    getCouriersWithRadios(),
  ])
    .then(([ridesByCourier, couriersWithRadios]) => {
      const courierPaystubs = ridesByCourier
        .map(rideGroup => {
          return new CourierPaystub(rideGroup.courier, rideGroup.rides, periodStart, periodEnd);
        })
        .concat(couriersWithRadios.map(courierWithRadio => {
          if (!ridesByCourier.find(rideGroup => rideGroup.courier._id.toString() === courierWithRadio._id.toString())) {
            return new CourierPaystub(courierWithRadio, [], periodStart, periodEnd);
          }
        }))
        .filter(courierPaystub => courierPaystub !== undefined)
        .filter(courierPaystub => courierPaystub.getPaystubTotal() !== 0);
      const quickbooksPayrollCredits = new QuickbooksPayrollCredits(courierPaystubs, periodStart, periodEnd);
      const quickbooksPayrollDebits = new QuickbooksPayrollDebits(courierPaystubs, periodStart, periodEnd);
      const quickbooksPayrollNonInvoicedIncome = new QuickbooksPayrollNonInvoicedIncome(courierPaystubs, periodStart, periodEnd);
      req.courierPaystubs = courierPaystubs;
      req.quickbooksPayrollCredits = quickbooksPayrollCredits;
      req.quickbooksPayrollDebits = quickbooksPayrollDebits;
      req.quickbooksPayrollNonInvoicedIncome = quickbooksPayrollNonInvoicedIncome;
      next();
    })
    .catch(next);
}

function getCouriersWithRadios() {
  return models.Courier.find({ monthlyRadioRental: true }).exec();
}

function getRidesByCourier(fromDate, toDate) {
  function doQuery(from, to) {
    return models.Ride.aggregate()
      // We need to watch the memory footprint on this query because
      // mongo can hit the 100mb aggregation stage memory limiton
      // periods with many rides. Mongodb's allowDiskUse() gets around
      // that but our shared mongo instance doesn't support it.
      .project({
        jobId: 1,
        client: 1,
        courier: 1,
        destinationAddress1: 1,
        deliveryStatus: 1,
        readyTime: 1,
        orderTotal: 1,
        billableTotal: 1,
        tip: 1,
        deliveryFee: 1,
      })
      .match({
        readyTime: {
          $gte: from,
          $lt: to
        },
        deliveryStatus: 'complete'
      })
      .lookup({
        from: 'clients',
        localField: 'client',
        foreignField: '_id',
        as: 'client'
      })
      // lookup stage always gives an array. Un-arrayify the client field.
      .addFields({
        client: { $arrayElemAt: ['$client', 0] }
      })
      .group({
        _id: { courier: '$courier' },
        rides: { $push: '$$ROOT' }
      })
      .lookup({
        from: 'couriers',
        localField: '_id.courier',
        foreignField: '_id',
        as: 'courier'
      })
      // lookup stage always gives an array. Un-arrayify the courier field.
      .addFields({
        courier: { $arrayElemAt: ['$courier', 0] }
      })
      // prod does not allow allowDiskUse(true) but local dev db has
      // it enabled by default. Set it false here so dev behaves like
      // prod. allowDiskUse(true) prevents errors resulting from
      // mongo's 100mb memory limit on aggregation stages by allowing
      // temp files to be written to disk.
      .allowDiskUse(false)
      .exec();
  }

  // Split up the time period into four separate queries to reduce the
  // memory footprint of each individual one, then combine the
  // results.
  const partitions = 4;
  const partitionSize = Math.floor((toDate.valueOf() - fromDate.valueOf()) / partitions);
  const periods = [];
  for (let from = fromDate.valueOf(); from <= toDate.valueOf(); from += partitionSize + 1) {
    periods.push([new Date(from), new Date(from + partitionSize)]);
  }
  const queries = periods.map(period => doQuery(period[0], period[1]));
  return Promise.all(queries)
    .then((allResults) => {
      const combined = _.flatten(allResults).reduce((memo, rideGroup) => {
        let group = memo.find(group => group.courier._id.toString() === rideGroup.courier._id.toString());
        if (!group) {
          group = rideGroup;
          memo.push(group);
        } else {
          group.rides.push(...rideGroup.rides);
        }
        return memo;
      }, []);
      return combined;
    });
}

function createPayrollZip(req, res, next) {
  req.payrollZip = new yazl.ZipFile();
  addFilesToZip()
    .then(zipSize => {
      req.payrollZipSize = zipSize;
      next();
    })
    .catch(next);
  
  function addFilesToZip() {
    // file naming per https://3.basecamp.com/3688031/buckets/6435030/todos/1331720820
    const addQuickbooksCreditsCsv = req.quickbooksPayrollCredits.renderCsv()
      .then(csvString => {
        const filename = `${formatDate(req.quickbooksPayrollCredits.periodEnd)} QB Payroll Bills - Import A.csv`;
        req.payrollZip.addBuffer(new Buffer(csvString), filename, { compress: false });
      });
    const addQuickbooksDebitsCsv = req.quickbooksPayrollDebits.renderCsv()
      .then(csvString => {
        const filename = `${formatDate(req.quickbooksPayrollDebits.periodEnd)} QB Payroll Deductions - Import B.csv`;
        req.payrollZip.addBuffer(new Buffer(csvString), filename, { compress: false });
      });
    const addQuickbooksNonInvoicedIncomeCsv = req.quickbooksPayrollNonInvoicedIncome.renderCsv()
      .then(csvString => {
        const filename = `${formatDate(req.quickbooksPayrollNonInvoicedIncome.periodEnd)} QB Non-Invoiced Income - Import D.csv`;
        req.payrollZip.addBuffer(new Buffer(csvString), filename, { compress: false });
      });
    const addPdfs = req.courierPaystubs.map(courierPaystub => {
      return courierPaystub.renderPdf()
        .then(buffer => {
          const filename = `couriers/${formatDate(courierPaystub.periodEnd)} Payroll Invoice - ${courierPaystub.getCourierCallNumber()} ${courierPaystub.getCourierName()}.pdf`;
          req.payrollZip.addBuffer(buffer, filename, { compress: false });
        });
    });
    return Promise.all([
      addQuickbooksCreditsCsv,
      addQuickbooksDebitsCsv,
      addQuickbooksNonInvoicedIncomeCsv,
      ...addPdfs
    ])
      .then(() => {
        return new Promise(resolve => {
          req.payrollZip.end(finalSize => {
            resolve(finalSize);
          });
        });
      });
  }
}

function servePayrollZip(req, res) {
  const periodStart = reportUtils.parseDate(req.query.periodStart);
  const periodEnd = reportUtils.parseDate(req.query.periodEnd);
  res.set({
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename=paystubs-${formatDate(periodStart)}-${formatDate(periodEnd)}.zip`
  });
  req.payrollZip.outputStream.pipe(res);
}

function savePayrollZip(s3) {
  return (req, res, next) => {
    const periodStart = reportUtils.parseDate(req.query.periodStart);
    const periodEnd = reportUtils.parseDate(req.query.periodEnd);
    const formatDate = (date) => moment(date).format('M-D-YYYY');
    const filename = `paystubs-${formatDate(periodStart)}-${formatDate(periodEnd)}.zip`;
    return new Promise((resolve, reject) => {
      s3.putObject({
        Bucket: process.env.S3_BUCKET,
        Key: filename,
        ACL: 'private',
        Body: req.payrollZip.outputStream,
        ContentLength: req.payrollZipSize
      }, (err, data) => {
        if (err) {
          reject(new Error(err));
        } else {
          resolve(data);
        }
      });
    })
      .then(() => {
        return new models.Payroll({
          periodStart,
          periodEnd,
          filePath: filename
        }).save();
      })
      .then(payroll => {
        res.json(payroll);
      })
      .catch(next);
  };
}

module.exports = router;
module.exports.getPayrolls = getPayrolls;
module.exports.downloadPayroll = downloadPayroll;
module.exports.generatePaystubs = generatePaystubs;
module.exports.createPayrollZip = createPayrollZip;
module.exports.servePayrollZip = servePayrollZip;
module.exports.savePayrollZip = savePayrollZip;
