const express = require('express');
const router = express.Router();
const models = require('../models');
const parseCsv = require('csv-parse');
const Busboy = require('busboy');
const transform = require('stream-transform');

router.get('/', getJobs);
router.post('/importpreview', importPreview);
router.post('/import', importJobs);

function getJobs(req, res, next) {
    models.Job.find().exec()
        .then(jobs => {
            res.json(jobs);
        })
        .catch(next);
}

function importPreview(req, res, next) {
    const csvParser = parseCsv({
        columns: true
    });
    const busboy = new Busboy({ headers: req.headers });

    req
        .pipe(busboy)
        .on('file', (fieldName, file, filename) => {
            let rowNumber = 0;
            file
                .pipe(csvParser)
                .pipe(transform((record, callback) => {
                    rowNumber++;
                    reportErrors(rowNumber, record, callback);
                }))
                .pipe(res)
                .on('error', err => {
                    next(err);
                });
        });

    function reportErrors(rowNumber, record, callback) {
        return Promise.resolve(models.Job.hydrateFromCsv(record))
            .then(job => {
                return job.validate();
            })
            .then(() => {
                callback();
            })
            .catch(err => {
                const message = `Problem on row ${rowNumber}: ${err.message}\n`;
                callback(null, message);
            });
    }
}

function justGetAnArray(req) {
    return new Promise((resolve, reject) => {
        let parsedCsv = [];
        req
            .pipe(busboy)
            .on('file', (fieldName, file, filename) => {
                file
                    .pipe(csvParser)
                    .on('readable', () => {
                        let record
                        while(record = csvParser.read()) {
                            parsedCsv.push(record);
                        }
                    })
                    .on('finish', () => {
                        resolve(parsedCsv);
                    })
                    .on('error', err => {
                        reject(err);
                    });
            })
    });
}

function importJobs(req, res, next) {

}

module.exports = router;
