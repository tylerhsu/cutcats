const express = require('express');
const _ = require('lodash');
const EventEmitter = require('events').EventEmitter;
const router = express.Router();
const models = require('../models');
const csv = require('csv');
const Busboy = require('busboy');
const transform = require('stream-transform');
const moment = require('moment');
const reportUtils = require('./util/reportUtils');
const error = require('./util/error');
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

function importRides (req, res, next) {
  let save = ['true', '1'].includes((req.query.save || '').toLowerCase());
  let shiftId = req.query.shiftId;
  if (save && !shiftId) {
    return next(error('shiftId is required'));
  }
  let rideImporter = new RideImporter({
    save,
    fieldsForAll: { shift: shiftId }
  });
  const csvParser = csv.parse({
    columns: true
  });

  const busboy = new Busboy({
    headers: req.headers
  });

  req
    .pipe(busboy)
    .on('file', (fieldName, file) => {
      file
        .pipe(csvParser)
        .on('end', () => {
          rideImporter.markEnd();
        })
        .pipe(transform(rideImporter.importRow))
        .pipe(res);
    });

  rideImporter.on('error', () => {
    res.status(400);
  });
}

class RideImporter extends EventEmitter {
  constructor (options = {
    save: true,
    fieldsForAll: {}
  }) {
    super();
    this.save = !!options.save;
    this.fieldsForAll = options.fieldsForAll;
    this.currentRow = 0;
    this.numRows = null;
    this.importRow = this.importRow.bind(this);
  }

  markEnd () {
    this.numRows = this.currentRow;
  }

  importRow (record, callback) {
    this.currentRow++;
    // this function can be called multiple times concurrently, so this.currentRow may change
    const row = this.currentRow;
    return Promise.resolve(models.Ride.hydrateFromCsv(record))
      .then(fields => {
        return models.Ride.findOne({ jobId: fields.jobId }).exec()
          .then(ride => {
            if (ride) {
              ride.set({
                ...this.fieldsForAll,
                ...fields
              });
            } else {
              ride = new models.Ride({
                ...this.fieldsForAll,
                ...fields
              });
            }
            return ride;
          });
      })
      .then(ride => {
        return this.save ? ride.save() : ride.validate();
      })
      .then(() => {
        callback();
      })
      .catch(err => {
        const message = `Problem on row ${row + 1}: ${friendly(err.message)}\n`;
        this.emit('error', message);
        callback(null, message);
      });
  }
}

function friendly (error) {
  if (error.match(/duplicate key/)) {
    const jobId = error.match(/"(.*)"/);
    return `A record with job ID ${jobId[1]} has already been imported`;
  } else {
    return error;
  }
}

module.exports = router;
