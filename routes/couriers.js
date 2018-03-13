const express = require('express');
const _ = require('underscore');
const router = express.Router();
const models = require('../models');
const getDocument = require('./middleware/getDocument');

router.get('/', getCouriers);
router.patch('/:id', getDocument(models.Courier), editCourier);

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

function editCourier(req, res, next) {
    const body = _.chain(req.body)
        .omit(['_id', 'updatedAt', 'createdAt', '__v'])
        .omit((value, key) => (value === ''))
        .value();
    req.courier.set(body);
    req.courier.save()
        .then(courier => {
            res.json(courier);
        })
        .catch(next);
}

module.exports = router;
