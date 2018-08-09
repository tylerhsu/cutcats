const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27357/test', { useNewUrlParser: true });
mongoose.plugin(require('mongoose-deep-populate')(mongoose));

const connected = new Promise(resolve => mongoose.connection.on('open', resolve));

module.exports = mongoose.connection;
module.exports.connected = connected;
