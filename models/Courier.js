const mongoose = require('mongoose');
const courierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  radioCallNumber: { type: Number, index: true, unique: true, required: true },
  phone: { type: String },
  email: { type: String, index: true, unique: true, sparse: true, lowercase: true },
  status: { type: String, enum: ['member', 'guest'], lowercase: true, required: true },
  startDate: { type: Date },
  monthlyRadioRental: { type: Boolean, required: true, default: true }
}, {
  timestamps: true
});

courierSchema.index({
  name: 'text',
  radioCallNumber: 'text',
  email: 'text'
});

module.exports = mongoose.model('Courier', courierSchema);
