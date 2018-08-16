const express = require('express');
const EventEmitter = require('events').EventEmitter;
const router = express.Router();
const models = require('../models');
const csv = require('csv');
const Busboy = require('busboy');
const transform = require('stream-transform');
const moment = require('moment');
const reportUtils = require('./util/reportUtils');
const error = require('./util/error');

router.get('/', getRides);
router.get('/csv', getRidesCsv);
router.post('/import', importRides);

function getRides (req, res, next) {
  let query = _getRidesQuery(req);
  const page = parseInt(req.query.page) || 1;
  const resultsPerPage = parseInt(req.query.resultsPerPage) || 100;
  const count = ['true', '1'].indexOf(req.query.count) > -1;

  if (count) {
    query.count();
  } else {
    query.skip((page - 1) * resultsPerPage).limit(resultsPerPage);
  }

  return query.exec()
    .then(rides => {
      if (count) {
        res.json({ count: rides });
      } else {
        res.json(rides);
      }
    })
    .catch(next);
}

function getRidesCsv (req, res, next) {
  const fromDate = reportUtils.parseDate(req.query.from);
  const toDate = reportUtils.parseDate(req.query.to);
  const filename = reportUtils.getFilename('rides', fromDate, toDate);
  res.set({
    'Content-Type': 'text/plain',
    'Content-Disposition': 'attachment; filename=' + filename
  });

  req.query.populate = 'client courier';

  return _getRidesQuery(req)
    .cursor()
    .pipe(csv.transform(transform))
    .on('error', next)
    .pipe(csv.stringify({
      header: true
    }))
    .on('error', next)
    .pipe(res)
    .on('error', next);

  function transform (ride, callback) {
    callback(null, {
      'Job ID': ride.jobId,
      'Client': ride.client.name,
      'Courier': ride.courier.name,
      'Origin address': ride.originAddress,
      'Destination address': ride.destinationAddress1,
      'Imported on': moment(ride.createdAt).format('MM/DD/YYYY')
    });
  }
}

function _getRidesQuery (req) {
  const fromDate = reportUtils.parseDate(req.query.from);
  const toDate = reportUtils.parseDate(req.query.to);
  let query = models.Ride.find();

  if (req.query.q) {
    query.find({ $text: { $search: req.query.q } });
  }

  if (fromDate) {
    query.where({ createdAt: { $gte: fromDate } });
  }

  if (toDate) {
    query.where({ createdAt: { $lte: toDate } });
  }

  if (req.query.populate) {
    query.populate(req.query.populate);
  }

  if (req.query.sort) {
    query.sort(req.query.sort);
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
