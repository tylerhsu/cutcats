const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const FileStore = require('session-file-store')(session);

module.exports = session({
    store: process.env.REDIS_URL ? new RedisStore({ url: process.env.REDIS_URL }) : new FileStore(),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
});
