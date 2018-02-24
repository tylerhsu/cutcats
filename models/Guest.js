const mongoose = require('mongoose');
const guestSchema = new mongoose.Schema({
    email: { type: String, index: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('Guest', guestSchema);
