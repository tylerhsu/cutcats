const mongoose = require('mongoose');
const shiftSchema = new mongoose.Schema({
  amDispatcher: { type: mongoose.Schema.Types.ObjectId, ref: 'Courier', required: true },
  pmDispatcher: { type: mongoose.Schema.Types.ObjectId, ref: 'Courier', required: true },
  date: { type: Date, required: true },
  comments: { type: String, required: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('Shift', shiftSchema);
