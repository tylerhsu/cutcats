const express = require('express');
const _ = require('underscore');
const router = express.Router();
const models = require('../models');
const getDocument = require('./middleware/getDocument');

router.get('/', getShifts);
router.post('/', createShift);
router.patch('/:id', getDocument(models.Shift), editShift);

function getShifts (req, res, next) {
  let query = models.Shift.find();

  return query.exec()
    .then(shifts => {
      res.json(shifts);
    })
    .catch(next);
}

function createShift (req, res, next) {
  const body = _.chain(req.body)
    .omit(['_id', 'updatedAt', 'createdAt', '__v'])
    .omit((value) => (value === ''))
    .value();
  const shift = new models.Shift(body);
  shift.save()
    .then(shift => {
      res.json(shift);
    })
    .catch(next);
}

function editShift (req, res, next) {
  const body = _.chain(req.body)
    .omit(['_id', 'updatedAt', 'createdAt', '__v'])
    .value();
  req.shift.set(body);
  req.shift.save()
    .then(shift => {
      res.json(shift);
    })
    .catch(next);
}

module.exports = router;
