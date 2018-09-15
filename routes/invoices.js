const express = require('express');
const path = require('path');
const yazl = require('yazl');
const moment = require('moment');
const router = express.Router();
const models = require('../models');
const boilerplate = require('./boilerplate');
const reportUtils = require('./util/reportUtils');
const ClientInvoice = require('./util/ClientInvoice');
const QuickbooksInvoice = require('./util/QuickbooksInvoice');
const error = require('./util/error');
const AWS = require('aws-sdk');

router.get('/', getInvoices);
router.post('/', boilerplate.create(models.Invoice));
router.get('/generate', generateInvoices, createInvoiceZip, serveInvoiceZip);
router.post('/generate', generateInvoices, createInvoiceZip, saveInvoiceZip(new AWS.S3()));
router.get('/:id', boilerplate.getOne(models.Invoice));
router.patch('/:id', boilerplate.update(models.Invoice));
router.delete('/:id', boilerplate.destroy(models.Invoice));
router.get('/:id/download', downloadInvoice(new AWS.S3()));

function getInvoices (req, res, next) {
  const fromDate = reportUtils.parseDate(req.query.from);
  const toDate = reportUtils.parseDate(req.query.to);
  const query = boilerplate.list.getQuery(models.Invoice, req);

  if (fromDate) {
    query.where({ periodEnd: { $gte: fromDate } });
  }

  if (toDate) {
    query.where({ periodStart: { $lte: toDate } });
  }

  return boilerplate.list.respond(query, req, res, next);
}

function downloadInvoice(s3) {
  return (req, res, next) => {
    return boilerplate.getOne.getQuery(models.Invoice, req)
      .then(invoice => {
        res.set({
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename=${path.basename(invoice.filePath)}`
        });
        s3.getObject({
          Bucket: process.env.S3_BUCKET,
          Key: invoice.filePath
        })
          .createReadStream()
          .pipe(res);
      })
      .catch(next);
  };
}

function generateInvoices (req, res, next) {
  const periodStart = reportUtils.parseDate(req.query.periodStart);
  const periodEnd = reportUtils.parseDate(req.query.periodEnd);
  const monthStart = moment(periodStart).startOf('month').toDate();
  const monthEnd = moment(periodEnd).endOf('month').toDate();
  
  if (isNaN(periodStart.valueOf())) {
    throw error('Start date is not a recognizable date', 400);
  }

  if (isNaN(periodEnd.valueOf())) {
    throw error('End date is not a recognizable date', 400);
  }

  // Get rides for the entire month because some invoicing calculations need them all regardless of the period boundaries.
  return getRidesByClient(monthStart, monthEnd)
    .then(ridesByClient => {
      const clientInvoices = ridesByClient
        .map(rideGroup => {
          return new ClientInvoice(rideGroup.client, rideGroup.rides, periodStart, periodEnd);
        })
        .filter(clientInvoice => {
          return clientInvoice.getInvoiceTotal() > 0;
        });
      const quickbooksInvoice = new QuickbooksInvoice(clientInvoices, periodStart, periodEnd, monthStart, monthEnd);
      req.clientInvoices = clientInvoices;
      req.quickbooksInvoice = quickbooksInvoice;
      next();
    })
    .catch(next);
}

function getRidesByClient(fromDate, toDate) {
  return models.Ride.aggregate()
    .match({
      readyTime: {
        $gte: fromDate,
        $lt: toDate
      },
      deliveryStatus: 'complete'
    })
    .group({
      _id: { client: '$client' },
      rides: { $push: '$$ROOT' }
    })
    .lookup({
      from: 'clients',
      localField: '_id.client',
      foreignField: '_id',
      as: 'client'
    })
    // lookup stage always gives an array. Un-arrayify the client field.
    .addFields({
      client: { $arrayElemAt: ['$client', 0] }
    })
    .exec();
}

function createInvoiceZip(req, res, next) {
  req.invoiceZip = new yazl.ZipFile();
  addFilesToZip()
    .then(zipSize => {
      req.invoiceZipSize = zipSize;
      next();
    })
    .catch(next);
  
  function addFilesToZip() {
    const addQuickbooksCsv = req.quickbooksInvoice.renderCsv()
      .then(csvString => {
        req.invoiceZip.addBuffer(new Buffer(csvString), 'quickbooks.csv', { compress: false });
      });
    const addPdfs = req.clientInvoices.map(clientInvoice => {
      return clientInvoice.renderPdf()
        .then(buffer => {
          req.invoiceZip.addBuffer(buffer, `clients/${clientInvoice.getClientName()}.pdf`, { compress: false });
        });
    });
    return Promise.all([
      addQuickbooksCsv,
      ...addPdfs
    ])
      .then(() => {
        return new Promise(resolve => {
          req.invoiceZip.end(finalSize => {
            resolve(finalSize);
          });
        });
      });
  }
}

function serveInvoiceZip(req, res) {
  const periodStart = reportUtils.parseDate(req.query.periodStart);
  const periodEnd = reportUtils.parseDate(req.query.periodEnd);
  const formatDate = (date) => moment(date).format('M-D-YYYY');
  res.set({
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename=invoices-${formatDate(periodStart)}-${formatDate(periodEnd)}.zip`
  });
  req.invoiceZip.outputStream.pipe(res);
}

function saveInvoiceZip(s3) {
  return (req, res, next) => {
    const periodStart = reportUtils.parseDate(req.query.periodStart);
    const periodEnd = reportUtils.parseDate(req.query.periodEnd);
    const formatDate = (date) => moment(date).format('M-D-YYYY');
    const filename = `invoices-${formatDate(periodStart)}-${formatDate(periodEnd)}.zip`;
    return new Promise((resolve, reject) => {
      s3.putObject({
        Bucket: process.env.S3_BUCKET,
        Key: filename,
        ACL: 'private',
        Body: req.invoiceZip.outputStream,
        ContentLength: req.invoiceZipSize
      }, (err, data) => {
        if (err) {
          reject(new Error(err));
        } else {
          resolve(data);
        }
      });
    })
      .then(() => {
        return new models.Invoice({
          periodStart,
          periodEnd,
          filePath: filename
        }).save();
      })
      .then(invoice => {
        res.json(invoice);
      })
      .catch(next);
  };
}

module.exports = router;
module.exports.getInvoices = getInvoices;
module.exports.downloadInvoice = downloadInvoice;
module.exports.generateInvoices = generateInvoices;
module.exports.createInvoiceZip = createInvoiceZip;
module.exports.serveInvoiceZip = serveInvoiceZip;
module.exports.saveInvoiceZip = saveInvoiceZip;
