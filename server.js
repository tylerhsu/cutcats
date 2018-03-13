require('dotenv').config();

const express = require('express');
const flash = require('connect-flash');
const app = express();
const sessionConfig = require('./sessionConfig');
const routes = require('./routes');
const mongoose = require('mongoose');
const passport = require('passport');
const compression = require('compression');
const port = parseInt(process.env.PORT) || 3000;
require('./passportConfig');

mongoose.connect(process.env.MONGODB_URI);
mongoose.plugin(require('mongoose-deep-populate'));

app.use(compression());

app.set('views', './views');
app.set('view engine', 'jsx');
app.engine('jsx', require('express-react-views').createEngine());

app.use(sessionConfig);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

if (process.env.NODE_ENV === 'production') {
    app.use(express.static('client/build', { extensions: 'html' }));
}

app.use('/', routes);

app.listen(port, () => {
    if (process.env.NODE_ENV !== 'production') {
        console.log('webpack dev server listening on port ' + (port + 1))
    }
});
