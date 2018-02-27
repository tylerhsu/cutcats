const express = require('express');
const router = express.Router();
const models = require('../models');
const parseCsv = require('csv-parse');
const Busboy = require('busboy');

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
    const parser = parseCsv();
    const busboy = new Busboy({ headers: req.headers });
    req.pipe(busboy);
    busboy.on('file', (fieldName, file, filename) => {
        file.pipe(res);
        /* file
         *     .pipe(parser)
         *     .on('data', chunk => {
         *         console.log(chunk);
         *     })
         *     .on('end', () => {
         *         res.status(200).send();
         *     })*/
    });
}

module.exports = router;
