const express = require('express');
const router = express.Router();
const models = require('../models');

router.get('/', getCouriers);

function getCouriers(req, res, next) {
    let query = models.Courier.find();

    if (req.query.q) {
        query.find({ $text: { $search: req.query.q } });
    }
    
    return query.exec()
        .then(couriers => {
            res.json(couriers);
        })
        .catch(next);
}

module.exports = router;
