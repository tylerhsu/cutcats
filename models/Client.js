const mongoose = require('mongoose');
const clientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    qbName: { type: String },
    paymentType: { type: String, enum: ['invoiced', 'paid', 'legacy'], lowercase: true },
    rep: { type: String },
    company: { type: String },
    address: { type: String },
    phone: { type: String },
    email: { type: String },
    zone: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
    fixedAdminFee: { type: Number },
    billingEmail: { type: String },
    hours: { type: String }
}, {
    timestamps: true
});

module.exports = mongoose.model('Client', clientSchema);
