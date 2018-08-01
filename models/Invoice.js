const mongoose = require('mongoose');
const invoiceSchema = new mongoose.Schema({
  periodStart: { type: Date, required: true, index: true },
  periodEnd: { type: Date, required: true, index: true },
  filePath: { type: String, required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Invoice', invoiceSchema);
