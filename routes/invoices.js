const express = require('express');
const _ = require('lodash');
const router = express.Router();
const models = require('../models');
const reportUtils = require('./util/reportUtils');
const getDocument = require('./middleware/getDocument');

router.get('/', getInvoices);
router.post('/', createInvoice);
router.patch('/:id', getDocument(models.Invoice), editInvoice);
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
