const mongoose = require('mongoose');
const clientSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  paymentType: { type: String, enum: ['invoiced', 'paid', 'legacy'], lowercase: true, required: true },
  address: { type: String },
  phone: { type: String },
  email: { type: String },
  adminFeeType: { type: String, enum: ['fixed', 'scale'], required: true },
  fixedAdminFee: {
    type: Number,
    required: [
      function() { return this.adminFeeType === 'fixed'; },
      'fixedAdminFee is required when adminFeeType is "fixed".'
    ]
  },
  deliveryFeeStructure: { type: String, enum: ['on demand food', 'legacy on demand food', 'catering food', 'cargo/wholesale/commissary'], required: true },
  billingEmail: { type: String }
}, {
  timestamps: true
});

clientSchema.index({
  name: 'text'
});

clientSchema.pre('save', function() {
  if (this.adminFeeType === 'scale') {
    this.fixedAdminFee = undefined;
  }
});

module.exports = mongoose.model('Client', clientSchema);
