const express = require('express');
const _ = require('underscore');
const router = express.Router();
const models = require('../models');
const getDocument = require('./middleware/getDocument');

router.get('/', getClients);
router.post('/', createClient);
router.patch('/:id', getDocument(models.Client), editClient);

function getClients (req, res, next) {
  let query = models.Client.find();

  if (req.query.q) {
    query.find({ $text: { $search: req.query.q } });
  }

  return query.exec()
    .then(clients => {
      res.json(clients);
    })
    .catch(next);
}

function createClient (req, res, next) {
  const body = _.chain(req.body)
    .omit(['_id', 'updatedAt', 'createdAt', '__v'])
    .omit((value) => (value === ''))
    .value();
  const client = new models.Client(body);
  client.save()
    .then(client => {
      res.json(client);
    })
    .catch(next);
}

function editClient (req, res, next) {
  const body = _.chain(req.body)
    .omit(['_id', 'updatedAt', 'createdAt', '__v'])
    .value();
  req.client.set(body);
  req.client.save()
    .then(client => {
      res.json(client);
    })
    .catch(next);
}

module.exports = router;
