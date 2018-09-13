const express = require('express');
const router = express.Router();
const models = require('../models');
const boilerplate = require('./boilerplate');

router.get('/', boilerplate.list(models.Zone));
router.patch('/:id', boilerplate.update(models.Zone));

module.exports = router;
