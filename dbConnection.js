if (!process.env.MONGODB_URI) {
    throw new Error('process.env.MONGODB_URI is not defined');
}

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true })
mongoose.plugin(require('mongoose-deep-populate')(mongoose));
