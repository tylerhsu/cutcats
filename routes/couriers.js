const express = require('express');
const router = express.Router();
const models = require('../models');
const boilerplate = require('./boilerplate');

router.get('/', getCouriers);
router.post('/', boilerplate.create(models.Courier));
router.get('/:id', boilerplate.getOne(models.Courier));
router.patch('/:id', boilerplate.update(models.Courier));
router.delete('/:id', boilerplate.destroy(models.Courier));

function getCouriers (req, res, next) {
  let query = boilerplate.list.getQuery(models.Courier, req);

  if (req.query.q) {
    query.find({ $text: { $search: req.query.q } });
  }

  if (req.query.hasRadio === 'true' || req.query.hasRadio === 'false') {
    const monthlyRadioRental = req.query.hasRadio === 'true' ? true : false;
    query.find({ monthlyRadioRental });
  }

  return boilerplate.list.respond(query, req, res, next);
}

module.exports = router;
