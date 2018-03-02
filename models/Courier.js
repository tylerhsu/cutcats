const mongoose = require('mongoose');
const courierSchema = new mongoose.Schema({
    name: { type: String, required: true },
    qbName: { type: String },
    radioCallNumber: { type: Number, index: true },
    radioFee: { type: Number },
    phone: { type: String },
    email: { type: String, index: true },
    depositPaid: { type: Boolean },
    status: { type: String },
    active: { type: Boolean },
    taxWithholding: { type: Number }
}, {
    timestamps: true
});

courierSchema.index({
    name: 'text',
    qbName: 'text',
    radioCallNumber: 'text',
    email: 'text'
});

module.exports = mongoose.model('Courier', courierSchema);
