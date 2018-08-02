const express = require('express');
const _ = require('lodash');
const router = express.Router();
const models = require('../models');
const getDocument = require('./middleware/getDocument');

router.get('/', getZones);
router.patch('/:id', getDocument(models.Zone), editZone);

function getZones (req, res, next) {
  let query = models.Zone.find();

  return query.exec()
    .then(zones => {
      res.json(zones);
    })
    .catch(next);
}

function editZone (req, res, next) {
  const body = _.chain(req.body)
    .omit(['_id', 'updatedAt', 'createdAt', '__v'])
    .omit((value) => (value === ''))
    .value();
  req.zone.set(body);
  req.zone.save()
    .then(zone => {
      res.json(zone);
    })
    .catch(next);
}

module.exports = router;
