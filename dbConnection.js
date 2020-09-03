if (!process.env.MONGODB_URI) {
  throw new Error('process.env.MONGODB_URI is not defined');
}

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.plugin(require('mongoose-deep-populate')(mongoose));

const connected = new Promise(resolve => mongoose.connection.on('open', resolve));

module.exports = mongoose.connection;
module.exports.connected = connected;

