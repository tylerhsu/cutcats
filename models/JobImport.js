const mongoose = require('mongoose');
const jobImportSchema = new mongoose.Schema({

}, {
    timestamps: true
});

module.exports = mongoose.model('JobImport', jobImportSchema);
