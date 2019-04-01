const express = require('express');
const { Writable, Transform, Duplex, pipeline } = require('stream');
const _ = require('lodash');
const EventEmitter = require('events').EventEmitter;
const router = express.Router();
const models = require('../models');
const csv = require('csv');
const Busboy = require('busboy');
const transform = require('stream-transform');
const moment = require('moment');
const reportUtils = require('./util/reportUtils');
const boilerplate = require('./boilerplate');

router.get('/', getRides);
router.get('/csv', getRidesCsv);
router.post('/import', importRides);

function getRides (req, res, next) {
  let query = _getRidesQuery(req);
  return boilerplate.list.respond(query, req, res, next);
}

function getRidesCsv (req, res, next) {
  const fromDate = reportUtils.parseDate(req.query.from);
  const toDate = reportUtils.parseDate(req.query.to);
  const filename = reportUtils.getFilename('rides', fromDate, toDate);
  res.set({
    'Content-Type': 'text/plain',
    'Content-Disposition': 'attachment; filename=' + filename
  });
  let query = _getRidesQuery(req)
    .populate('client courier')
    .skip(0)
    .limit(10000)
    .lean();

  return query
    .cursor()
    .pipe(csv.transform(transform))
    .pipe(csv.stringify({
      header: true
    }))
    .pipe(res)
    .on('error', next);

  function transform (ride, callback) {
    const row = _.chain({
      ...ride,
      'client': ride.client.name,
      'courier': ride.courier.name,
      'Imported on': moment(ride.createdAt).format('MM/DD/YYYY')
    })
      .value();
    callback(null, row);
  }
}

function _getRidesQuery (req) {
  const fromDate = reportUtils.parseDate(req.query.from);
  const toDate = reportUtils.parseDate(req.query.to);
  let query = boilerplate.list.getQuery(models.Ride, req);

  if (req.query.q) {
    query.find({ $text: { $search: req.query.q } });
  }

  if (fromDate) {
    query.where({ readyTime: { $gte: fromDate } });
  }

  if (toDate) {
    query.where({ readyTime: { $lte: toDate } });
  }

  return query;
}

function importRides (req, res) {
  const save = ['true', '1'].includes((req.query.save || '').toLowerCase());
  const busboy = new Busboy({ headers: req.headers });
  let errorCount = 0;

  req
    .pipe(busboy)
    .on('file', (fieldName, file) => {
      file
        .pipe(csv.parse({ columns: true }))
        .pipe(new AppendRowNumbers())
        .pipe(new Batcher(100))
        .pipe(new RideImporter({ save }))
        .on('data', () => {
          // The only data rideImporter supplies is error messages
          res.status(400);
        })
        .pipe(res);
    });
}

class AppendRowNumbers extends Transform {
  constructor(options = {}) {
    options.writableObjectMode = true;
    options.readableObjectMode = true;
    super(options);
    this.rowNumber = 0;
  }

  _transform(chunk, encoding, callback) {
    this.rowNumber++;
    callback(null, [this.rowNumber, chunk]);
  }
}

class Batcher extends Transform {
   constructor(batchSize, options = {}) {
     options.writableObjectMode = true;
     options.readableObjectMode = true;
     super(options);
     this.batchSize = batchSize;
     this.buffer = [];
   }
  
  _transform(chunk, encoding, callback) {
    this.buffer.push(chunk);
    if (this.buffer.length >= this.batchSize) {
      callback(null, this.buffer);
      this.buffer = [];
    } else {
      callback();
    }
  }

  _flush(callback) {
    callback(null, this.buffer);
    this.buffer = [];
  }
}

class RideImporter extends Transform {
  constructor (options = {}) {
    options.writableObjectMode = true;
    super(options);
    options = Object.assign({
      save: true,
      fieldsForAll: {},
      errorLimit: 100,
    }, options);
    this.save = !!options.save;
    this.fieldsForAll = options.fieldsForAll;
    this.errorLimit = options.errorLimit;
    this.errorCount = 0;
    this.cache = {};
    this.errors = [];
  }

  _writev(chunks, callback) {
    chunks.forEach(chunk => {
      this._transform(chunk.chunk, chunk.encoding, chunk.callback);
    });
    callback();
  }
  
  _transform(batchOfRows, encoding, callback) {
    return Promise.all(batchOfRows.map(rowData => {
      const [rowNumber, row] = rowData;
      return models.Ride.hydrateFromCsv(row, this.cache)
        .catch(err => {
          this.push(`Problem on row ${rowNumber}: ${err.message}\n`);
        });
    }))
      .then(hydratedRows => {
        hydratedRows = hydratedRows.filter(hydratedRow => !!hydratedRow);
        const jobIds = hydratedRows.map(hydratedRow => hydratedRow.jobId);
        if (!jobIds.length) {
          return;
        }
        return models.Ride.find({ jobId: { $in: jobIds } }).exec()
          .then(rides => {
            const hasJobId = (jobId) => (doc) => doc.jobId === jobId;
            const findOrCreateRide = (jobId) => {
              const ride = rides.find(hasJobId(jobId)) || new models.Ride();
              const hydratedRow = hydratedRows.find(hasJobId(jobId));
              ride.set({
                ...this.fieldsForAll,
                ...hydratedRow,
              });
              return ride;
            };
            const docs = jobIds.map(findOrCreateRide);
            return Promise.all(docs.map(doc => {
              return (this.save ? doc.save() : doc.validate())
                .catch(err => {
                  this.push(err);
                });
            }));
          });
      })
      .then(() => {
        callback();
      })
      .catch(err => {
        callback(err);
      });
  }
}

module.exports = router;
