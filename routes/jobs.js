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
    models.Job.find().exec()
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
        this.jobImport = new models.JobImport();
        this.importRow = this.importRow.bind(this);
    }

    markEnd() {
        this.numRows = this.currentRow;
    }
    
    importRow(record, callback) {
        this.currentRow++;
        const row = this.currentRow;
        return Promise.resolve(models.Job.hydrateFromCsv(record))
            .then(job => {
                job.jobImport = this.jobImport;
                return this.save ? job.save() : job.validate();
            })
            .then(() => {
                if (this.save && this.jobImport.isNew) {
                    return this.jobImport.save();
                }
            })
            .then(() => {
                callback();
            })
            .catch(err => {
                const message = `Problem on row ${row + 1}: ${err.message}\n`;
                this.emit('error', message);
                callback(null, message);
            });
    }
}

module.exports = router;
