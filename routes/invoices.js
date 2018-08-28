const express = require('express');
const _ = require('lodash');
const yazl = require('yazl');
const moment = require('moment');
const router = express.Router();
const models = require('../models');
const reportUtils = require('./util/reportUtils');
const getDocument = require('./middleware/getDocument');
const ClientInvoice = require('./util/ClientInvoice');
const QuickbooksInvoice = require('./util/QuickbooksInvoice');
const error = require('./util/error');

router.get('/', getInvoices);
router.post('/', createInvoice);
router.patch('/:id', getDocument(models.Invoice), editInvoice);
router.get('/generate', generateInvoices, createInvoiceZip, serveInvoiceZip);
/* router.get('/csv', getInvoicesCsv);*/

function getInvoices (req, res, next) {
  let query = _getInvoicesQuery(req);
  const page = parseInt(req.query.page) || 1;
  const resultsPerPage = parseInt(req.query.resultsPerPage) || 100;
  const count = ['true', '1'].indexOf(req.query.count) > -1;

  if (count) {
    query.count();
  } else {
    query.skip((page - 1) * resultsPerPage).limit(resultsPerPage);
  }

  return query.exec()
    .then(invoices => {
      if (count) {
        res.json({ count: invoices });
      } else {
        res.json(invoices);
      }
    })
    .catch(next);
}

function createInvoice (req, res, next) {
  const body = _.chain(req.body)
    .omit(['_id', 'updatedAt', 'createdAt', '__v'])
    .omit((value) => (value === ''))
    .value();
  const invoice = new models.Invoice(body);
  return invoice.save()
    .then(invoice => {
      res.status(201).json(invoice);
    })
    .catch(next);
}

function editInvoice (req, res, next) {
  const body = _.chain(req.body)
    .omit(['_id', 'updatedAt', 'createdAt', '__v'])
    .value();
  req.invoice.set(body);
  return req.invoice.save()
    .then(invoice => {
      res.json(invoice);
    })
    .catch(next);
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
          return new ClientInvoice(rideGroup._id.client, rideGroup.rides, periodStart, periodEnd);
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
      _id: { client: '$client' },
      rides: { $push: '$$ROOT' }
    })
    .exec();
}

function createInvoiceZip(req, res, next) {
  req.invoiceZip = new yazl.ZipFile();
  next();
  req.invoiceZip.addReadStream(req.quickbooksInvoice.renderCsv(), 'quickbooks.csv');
  Promise.all(req.clientInvoices.map(clientInvoice => {
    return clientInvoice.renderPdf()
      .then(buffer => {
        req.invoiceZip.addBuffer(buffer, `clients/${clientInvoice.getClientName()}.pdf`);
      });
  }))
    .then(() => {
      req.invoiceZip.end();
    });
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

/* function getInvoicesCsv (req, res, next) {
 *   const { fromDate, toDate } = reportUtils.parseDates(req.query);
 *   const filename = reportUtils.getFilename('invoices', fromDate, toDate);
 *   res.set({
 *     'Content-Type': 'text/plain',
 *     'Content-Disposition': 'attachment; filename=' + filename
 *   });
 * 
 *   return _getInvoicesQuery(req)
 *     .cursor()
 *     .exec()
 *     .on('error', next)
 *     .pipe(csv.transform(transform))
 *     .on('error', next)
 *     .pipe(csv.stringify({
 *       header: true
 *     }))
 *     .on('error', next)
 *     .pipe(res)
 *     .on('error', next);
 * 
 *   function transform (ridesByClient, callback) {
 *     callback(null, {
 *       'Client name': ridesByClient._id.client.name,
 *       'Rides completed': ridesByClient.rideCount,
 *       'Billable total': reportUtils.precisionRound(ridesByClient.balance, 2)
 *     });
 *   }
 * }*/

function _getInvoicesQuery (req) {
  const fromDate = reportUtils.parseDate(req.query.from);
  const toDate = reportUtils.parseDate(req.query.to);
  let query = models.Invoice.find();

  if (fromDate) {
    query.where({ periodEnd: { $gte: fromDate } });
  }

  if (toDate) {
    query.where({ periodStart: { $lte: toDate } });
  }

  if (req.query.populate) {
    query.populate(req.query.populate);
  }

  if (req.query.sort) {
    query.sort(req.query.sort);
  }

  return query;
}

module.exports = router;
module.exports.getInvoices = getInvoices;
module.exports.createInvoice = createInvoice;
module.exports.editInvoice = editInvoice;
module.exports.generateInvoices = generateInvoices;
module.exports.createInvoiceZip = createInvoiceZip;
module.exports.serveInvoiceZip = serveInvoiceZip;
