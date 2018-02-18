const mongoose = require('mongoose');
const clientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    qbName: { type: String },
    paymentType: { type: String, enum: ['invoiced', 'paid'] },
    rep: { type: String },
    company: { type: String },
    address: { type: String },
    phone: { type: String },
    email: { type: String },
    zone: { type: mongoose.schema.types.ObjectId, ref: 'Zone' },
    fixedAdminFee: { type: Number },
    billingEmail: { type: String },
    hours: { type: String }
});

module.exports = mongoose.model('Client', clientSchema);
