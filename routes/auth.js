const express = require('express');
const passport = require('passport');
const router = express.Router();
const models = require('../models');

router.get('/login', getLogin);
router.get('/logout', getLogout);
router.get(
    '/google',
    passport.authenticate('google', { scope: ['email profile'] })
);
router.get(
    '/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/auth/login',
        failureFlash: true
    }),
    (req, res, next) => {
        const redirect = req.session.returnUrl || '/';
        delete req.session.returnUrl
        res.redirect(redirect);
    }
);

function getLogin(req, res, next) {
    const error = (req.flash('error') || [])[0];
    req.session.returnUrl = req.query.returnUrl;
    res.render('login', { error });
}

function getLogout(req, res, next) {
    req.logout();
    res.redirect('/');
}

module.exports = router;
