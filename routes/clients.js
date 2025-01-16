const express = require('express');
const router = express.Router();
const models = require('../models');
const boilerplate = require('./boilerplate');

router.get('/', getClients);
router.post('/', boilerplate.create(models.Client));
router.get('/:id', boilerplate.getOne(models.Client));
router.patch('/:id', boilerplate.update(models.Client));
router.delete('/:id', boilerplate.destroy(models.Client));

function getClients (req, res, next) {
  let query = boilerplate.list.getQuery(models.Client, req);

  if (req.query.q) {
    query.find({ $text: { $search: req.query.q } });
  }

  if (req.query.deliveryFeeStructure) {
    query.find({ deliveryFeeStructure: req.query.deliveryFeeStructure });
  }

  return boilerplate.list.respond(query, req, res, next);
}

module.exports = router;
