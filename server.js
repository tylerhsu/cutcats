require('dotenv').config();

const cluster = require('cluster');
const express = require('express');
const flash = require('connect-flash');
const app = express();
const sessionConfig = require('./sessionConfig');
const routes = require('./routes');
const passport = require('passport');
const compression = require('compression');
const port = parseInt(process.env.PORT) || 3000;
require('./passportConfig');
require('./dbConnection');

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
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  // mongo duplicate key error
  if (err.code === 11000) {
    res.status(400);
    const fieldName = err.message.match(/\$(.+)_/);
    const value = err.message.match(/\{ : (.+) \}/);
    if (fieldName && value) {
      err.message = `${fieldName[1]} ${value[1]} is already taken`;
    }
  }

  if (res.statusCode === 200) {
    // mongoose validation error
    if (err.errors) {
      res.status(400);
    } else {
      res.status(500);
    }
  }
  if (req.accepts(['html', 'json']) === 'json') {
    /* eslint-disable no-console */
    console.error(err);
    res.json(err);
  } else {
    return next(err);
  }
});

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  // https://devcenter.heroku.com/articles/node-memory-use#running-multiple-processes
  const numWorkers = parseInt(process.env.WEB_CONCURRENCY) || 1;
  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    console.log(`worker ${worker.process.pid} died`);
    // start a new worker to replace the one that died
    cluster.fork();
  });
} else {
  app.listen(port, () => {
    console.log(`Worker ${process.pid} listening`);
    if (process.env.NODE_ENV !== 'production') {
      /* eslint-disable no-console */
      console.log('webpack dev server listening on port ' + (port + 1));
    }
  });
}
