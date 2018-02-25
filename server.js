require('dotenv').config();

const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const flash = require('connect-flash');
const app = express();
const routes = require('./routes');
const mongoose = require('mongoose');
const passport = require('passport');
const port = parseInt(process.env.PORT) || 3000;
require('./passportConfig');

mongoose.connect(process.env.MONGODB_URI);

app.set('views', './views');
app.set('view engine', 'jsx');
app.engine('jsx', require('express-react-views').createEngine());

app.use(session({
    store: process.env.NODE_ENV === 'production' ? new RedisStore({ url: process.env.REDIS_URL }) : undefined,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use(express.static('client/build', { extensions: 'html' }));

app.use('/', routes);

app.listen(port, () => {
    if (process.env.NODE_ENV !== 'production') {
        console.log('webpack dev server listening on port ' + (port + 1))
    }
});
