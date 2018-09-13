const express = require('express');
const router = express.Router();
const models = require('../models');
const boilerplate = require('./boilerplate');

router.get('/', boilerplate.list(models.Shift));
router.post('/', boilerplate.create(models.Shift));
router.patch('/:id', boilerplate.update(models.Shift));

module.exports = router;
