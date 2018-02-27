const express = require('express');
const passport = require('passport');
const router = express.Router();
const bodyParser = require('body-parser');

router.use(bodyParser.json({ extended: true }));

router.use('/auth', require('./auth'));
router.use('/api', requireAuth, require('./api'));

function requireAuth(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.status(401).send();
    }
}

module.exports = router;
