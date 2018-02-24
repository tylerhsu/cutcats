const express = require('express');
const router = express.Router();
const models = require('../models');

router.get('/', getMe);

function getMe(req, res, next) {
    res.json(req.user);
}

module.exports = router;
