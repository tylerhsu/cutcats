const express = require('express');
const router = express.Router();
const models = require('../models');
const boilerplate = require('./boilerplate');

router.get('/', boilerplate.list(models.Payroll));
router.post('/', boilerplate.create(models.Payroll));
router.get('/:id', boilerplate.getOne(models.Payroll));
router.patch('/:id', boilerplate.update(models.Payroll));
router.delete('/:id', boilerplate.destroy(models.Payroll));

module.exports = router;
