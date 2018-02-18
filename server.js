require('dotenv').config();

const express = require('express');
const app = express();
const routes = require('./routes');
const mongoose = require('mongoose');
const port = (parseInt(process.env.PORT) || 3000);

mongoose.connect(process.env.MONGODB_URI);

if (process.env.NODE_ENV === 'production') {
    app.use(express.static('client/build', { extensions: 'html' }));
}

app.use('/api', routes);

app.listen(port, () => console.log('Example app listening on port ' + port));
