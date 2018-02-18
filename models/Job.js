const mongoose = require('mongoose');
const jobSchema = new mongoose.Schema({
    jobId: { type: String, },
    externalId: { type: String },
    billingReference: { type: String },
    orderPlacer: { type: String },
    provider: { type: String },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    courier: { type: mongoose.Schema.Types.ObjectId, ref: 'Courier' },
    originName: { type: String },
    originAddress: { type: String },
    originPostalCode: { type: String },
    originZone: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
    destinationName: { type: String },
    destinationAddress1: { type: String },
    destinationAddress2: { type: String },
    destinationPostalCode: { type: String },
    destinationZone: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
    deliveryStatus: { type: String, enum: ['delivered', 'complete'] },
    elapsedPickupTimeSeconds: { type: Number },
    transitTimeSeconds: { type: Number },
    fulfillmentTime: { type: Number },
    timeLeft: { type: Number },
    dateTimeDelivered: { type: Date },
    creationTime: { type: Date },
    readyTime: { type: Date },
    dueTime: { type: Date },
    jobType: { type: Number },
    service: { type: String },
    rate: { type: String },
    isPaid: { type: Boolean },
    paymentMethod: { type: String },
    orderTotal: { type: Number, required: true },
    billableTotal: { type: Number, required: true },
    breakdown: { type: String },
    tip: { type: Number },
    deliveryFee: { type: Number },
    extras: { type: String },
    items: { type: String },
    deliveryNotes: { type: String },
    pod: { type: String },
    specialInstructions: { type: String },
    haversineMiles: { type: Number },
    routeMiles: { type: Number }
}, {
    timestamps: true
});

jobSchema.index({
    jobId: 'text',
    externalId: 'text',
    billingReference: 'text',
    orderPlacer: 'text',
    originName: 'text'
});

module.exports = mongoose.model('Job', jobSchema);
