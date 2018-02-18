const express = require('express');
const router = express.Router();
const models = require('../models');

router.get('/', getCouriers);

function getCouriers(req, res, next) {
    models.Courier.find()
        .then(couriers => {
            res.json(couriers);
        })
        .catch(next);
}

module.exports = router;
