const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/', getRoot);
router.use('/auth', require('./auth'));
router.use('/api', requireAuth, require('./api'));

function requireAuth(req, res, next) {
    console.log(req.originalUrl);
    console.log(req.accepts(['html', 'json']));
    if (req.user) {
        next();
    } else {
        if (req.accepts(['html', 'json']) === 'html') {
            res.redirect('/');
        } else {
            res.status(401).send();
        }
    }
}

function getRoot(req, res, next) {
    if (req.user) {
        res.redirect('/couriers');
    } else {
        res.redirect('/auth/login');
    }
}

module.exports = router;
