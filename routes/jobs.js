const express = require('express');
const EventEmitter = require('events').EventEmitter;
const router = express.Router();
const models = require('../models');
const csv = require('csv');
const Busboy = require('busboy');
const transform = require('stream-transform');
const moment = require('moment');
const reportUtils = require('./util/reportUtils')

router.get('/', getJobs);
router.get('/csv', getJobsCsv);
router.post('/import', importJobs);

function getJobs(req, res, next) {
    return _getJobsQuery(req).exec()
        .then(jobs => {
            res.json(jobs);
        })
        .catch(next);
}

function getJobsCsv(req, res, next) {
    const { fromDate, toDate } = reportUtils.parseDates(req.query);
    const filename = reportUtils.getFilename('rides', fromDate, toDate);
    res.set({
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename=' + filename
    });

    req.query.populate = 'client courier';

    return _getJobsQuery(req)
        .cursor()
        .pipe(csv.transform(transform))
        .on('error', next)
        .pipe(csv.stringify({
            header: true
        }))
        .on('error', next)
        .pipe(res)
        .on('error', next);

    function transform(job, callback) {
        callback(null, {
            'Ride ID': job.jobId,
            'Client': job.client.name,
            'Courier': job.courier.name,
            'Origin address': job.originAddress,
            'Destination address': job.destinationAddress1,
            'Imported on': moment(job.createdAt).format('MM/DD/YYYY')
        });
    }
}

function _getJobsQuery(req) {
    const { fromDate, toDate } = reportUtils.parseDates(req.query);
    let query = models.Job.find();
    
    if (req.query.q) {
        query.find({ $text: { $search: req.query.q } });
    }

    console.log(fromDate, toDate);

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

function importJobs(req, res, next) {
    let save = ['true', '1'].includes((req.query.save || '').toLowerCase());
    let jobImporter = new JobImporter({ save });
    const csvParser = csv.parse({
        columns: true
    });
    
    const busboy = new Busboy({
        headers: req.headers
    });

    req
        .pipe(busboy)
        .on('file', (fieldName, file, filename) => {
            file
                .pipe(csvParser)
                .on('end', () => {
                    jobImporter.markEnd();
                })
                .pipe(transform(jobImporter.importRow))
                .pipe(res);
        });

    jobImporter.on('error', () => {
        res.status(400);
    });
}

class JobImporter extends EventEmitter {
    constructor(options = { save: true }) {
        super();
        this.save = !!options.save;
        this.currentRow = 0;
        this.numRows = null;
        this.importRow = this.importRow.bind(this);
    }

    markEnd() {
        this.numRows = this.currentRow;
    }
    
    importRow(record, callback) {
        this.currentRow++;
        // this function can be called multiple times concurrently, so this.currentRow may change
        const row = this.currentRow;
        return Promise.resolve(models.Job.hydrateFromCsv(record))
            .then(fields => {
                return models.Job.findOne({ jobId: fields.jobId }).exec()
                    .then(job => {
                        if (job) {
                            job.set(fields);
                        } else {
                            job = new models.Job(fields);
                        }
                        return job;
                    });
            })
            .then(job => {
                return this.save ? job.save() : job.validate();
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

function friendly(error) {
    if (error.match(/duplicate key/)) {
        const jobId = error.match(/"(.*)"/);
        return `A record with job ID ${jobId[1]} has already been imported`;
    } else {
        return error;
    }
}

module.exports = router;
