const express = require('express');
const EventEmitter = require('events').EventEmitter;
const router = express.Router();
const models = require('../models');
const parseCsv = require('csv-parse');
const Busboy = require('busboy');
const transform = require('stream-transform');

router.get('/', getJobs);
router.post('/import', importJobs);

function getJobs(req, res, next) {
    let query = models.Job.find();
    
    if (req.query.q) {
        query.find({ $text: { $search: req.query.q } });
    }

    if (req.query.populate) {
        query.populate(req.query.populate);
    }

    if (req.query.sort) {
        query.sort(req.query.sort);
    }

    return query.exec()
        .then(jobs => {
            res.json(jobs);
        })
        .catch(next);
}

function importJobs(req, res, next) {
    let save = ['true', '1'].includes((req.query.save || '').toLowerCase());
    let jobImporter = new JobImporter({ save });
    const csvParser = parseCsv({
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
