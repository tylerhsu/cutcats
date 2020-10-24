const mongoose = require('mongoose');
const clientSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  paymentType: { type: String, enum: ['invoiced', 'paid', 'legacy'], lowercase: true, required: true },
  address: { type: String },
  phone: { type: String },
  email: { type: String },
  adminFeeType: { type: String, enum: ['fixed', 'scale', 'percentage'], required: true },
  fixedAdminFee: {
    type: Number,
    required: [
      function() { return this.adminFeeType === 'fixed'; },
      'fixedAdminFee is required when adminFeeType is "fixed".'
    ]
  },
  percentageAdminFee: {
    type: Number,
    required: [
      function() { return this.adminFeeType === 'percentage'; },
      'percentageAdminFee is required when adminFeeType is "percentage".'
    ]
  },
  deliveryFeeStructure: { type: String, enum: ['on demand food', 'legacy on demand food', 'catering food', 'cargo/wholesale/commissary'], required: true },
  billingEmail: { type: String },
  isSubjectToDowntownSalesTax: { type: Boolean },
}, {
  timestamps: true
});

clientSchema.index({
  name: 'text'
});

clientSchema.pre('save', function() {
  if (this.adminFeeType !== 'fixed') {
    this.fixedAdminFee = undefined;
  }
  if (this.adminFeeType !== 'percentage') {
    this.percentageAdminFee = undefined;
  }
});

module.exports = mongoose.model('Client', clientSchema);
