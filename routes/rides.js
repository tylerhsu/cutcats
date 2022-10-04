const express = require('express');
const { Transform } = require('stream');
const _ = require('lodash');
const router = express.Router();
const models = require('../models');
const csv = require('csv');
const Busboy = require('busboy');
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
  res.write('[');

  // We want to start streaming data to the client right away to avoid timeouts.
  // But after the first call to res.write(), we can no longer set a status code because the headers have already been sent.
  // So we'll always return 200, and indicate errors by giving the response special attributes.
  req
    .pipe(busboy)
    .on('file', (fieldName, file) => {
      file
        .pipe(csv.parse({ columns: true }))
        .pipe(new AppendRowNumbers())
        .pipe(new Batcher(100))
        .pipe(new RideImporter({ save }))
        .on('data', (chunk) => {
          res.write(`${JSON.stringify(chunk)},`);
        })
        .on('finish', () => {
          // one way to deal with trailing comma
          res.write(JSON.stringify({ messageType: 'end' }));
          res.write(']');
          res.send();
        })
        .on('error', (err) => {
          /* eslint-disable no-console */
          console.log(err);
          res.write(JSON.stringify({ messageType: 'criticalError', message: _.get(err, 'message', err.toString()) }));
          res.write(']');
          res.send();
        });
    });
}

class AppendRowNumbers extends Transform {
  constructor(options = {}) {
    options.writableObjectMode = true;
    options.readableObjectMode = true;
    super(options);
    this.rowNumber = 1;
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
    options.readableObjectMode = true;
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
    this.jobIdsSeenSoFar = [];
  }

  async _writev(chunks, callback) {
    try {
      await Promise.all(chunks.map(async chunk => {
        return await this._transform(chunk.chunk, chunk.encoding, chunk.callback);
      }));
      callback();
    } catch (err) {
      callback(err);
    }
  }
  
  async _transform(batchOfRows, encoding, callback) {
    try {
      let hydratedRows = await Promise.all(batchOfRows.map(async rowData => {
        const [rowNumber, row] = rowData;
        try {
          const hydratedRow = await models.Ride.hydrateFromCsv(row, this.cache);
          if (_.includes(this.jobIdsSeenSoFar, hydratedRow.jobId)) {
            throw new Error(`Job ID ${hydratedRow.jobId} appears more than once`);
          }
          this.jobIdsSeenSoFar.push(hydratedRow.jobId);
          return hydratedRow;
        } catch (err) {
          this.push({ messageType: 'validationError', message: `Problem on row ${rowNumber}: ${err.message}\n` });
          return null;
        }
      }));
      hydratedRows = hydratedRows.filter(hydratedRow => !!hydratedRow);
      const jobIds = hydratedRows.map(hydratedRow => hydratedRow.jobId);
      if (!jobIds.length) {
        return callback();
      }
      const rides = await models.Ride.find({ jobId: { $in: jobIds } }).exec();
      const findOrCreateRide = (jobId) => {
        const hasJobId = (doc) => doc.jobId === jobId;
        const ride = rides.find(hasJobId) || new models.Ride();
        const hydratedRow = hydratedRows.find(hasJobId);
        ride.set({
          ...this.fieldsForAll,
          ...hydratedRow,
        });
        return ride;
      };
      const docs = jobIds.map(findOrCreateRide);
      await Promise.all(docs.map(async doc => {
        if (this.save) {
          await doc.save();
          this.push({ messageType: 'success', message: `Imported job ${doc.jobId}` });
        } else {
          try {
            await doc.validate();
            this.push({ messageType: 'success', message: `Validated job ${doc.jobId}` });
          } catch (err) {
            this.push({ messageType: 'validationError', message: err.toString() });
          }
        }
      }));
      callback();
    } catch (err) {
      callback(err);
    }
  }
}

module.exports = router;
