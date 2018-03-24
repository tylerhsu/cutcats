const mongoose = require('mongoose');
const courierSchema = new mongoose.Schema({
    name: { type: String, required: true },
    radioCallNumber: { type: Number, index: true, required: true },
    phone: { type: String },
    email: { type: String, index: true },
    status: { type: String, enum: ['member', 'guest'], lowercase: true },
    startDate: { type: Date }
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
