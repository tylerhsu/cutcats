const mongoose = require('mongoose');
const models = require('.');
const hydrateFromCsv = require('./hydrateFromCsv');
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
    originZone: { type: String },
    destinationName: { type: String },
    destinationAddress1: { type: String },
    destinationAddress2: { type: String },
    destinationPostalCode: { type: String },
    destinationZone: { String },
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

// csv column -> model field
const CSV_COLUMN_MAP = {
    'job id': 'jobId',
    'external id': 'externalId',
    'billing reference': 'billingReference',
    'order placer': 'orderPlacer',
    'provider': 'provider',
    'client name': { name: 'client', hydrate: hydrateClient },
    'courier': { name: 'courier', hydrate: hydrateCourier },
    'origin name': 'originName',
    'origin street': 'originAddress',
    'origin postal code': 'originPostalCode',
    'origin zone': 'originZone',
    'destination name': 'destinationName',
    'destination street': 'destinationAddress1',
    'destination floor/suite/apt.': 'destinationAddress2',
    'destination postal code': 'destinationPostalCode',
    'destination zone': 'destinationZone',
    'delivery status': 'deliveryStatus',
    'elapsed pickup time': 'elapsedPickupTimeSeconds',
    'transit time': 'transitTimeSeconds',
    'fulfillment time': 'fulfillmentTime',
    'time left': 'timeLeft',
    'timeframe': 'dateTimeDelivered',
    'creation time': 'creationTime',
    'ready time': 'readyTime',
    'due time': 'dueTime',
    'job type': 'jobType',
    'service': 'service',
    'rate': 'rate',
    'is paid': 'isPaid',
    'payment method as string': 'paymentMethod',
    'order total': 'orderTotal',
    'billable total': 'billableTotal',
    'breakdown': 'breakdown',
    'tip': 'tip',
    'delivery fee': 'deliveryFee',
    'extras': 'extras',
    'items': 'items',
    'delivery notes': 'deliveryNotes',
    'pod': 'pod',
    'special instructions': 'specialInstructions',
    'haversine mi': 'haversineMiles',
    'route mi': 'routeMiles'
};

function hydrateClient(csvValue) {
    return models.Client.find({ $text: { $search: csvValue } }).exec()
        .then(results => {
            if (!(results && results.length)) {
                throw new Error(`Could not find client "${csvValue}"`);
            } else if (results.length > 1) {
                const names = results.map(result => `"${result.name}"`).join(', ');
                throw new Error(`Ambiguous client name "${csvValue}" (matched ${results.length} clients: ${names})`)
            } else {
                return results[0];
            }
        });
}

function hydrateCourier(csvValue, csvRow) {
    const radioCallNumber = csvRow['courier number'];
    
    if (radioCallNumber === undefined) {
        throw new Error('"courier number" column is missing or empty. This column is required.');
    }
    
    return models.Courier.findOne({ radioCallNumber }).exec()
        .then(courier => {
            if (!courier) {
                throw new Error(`Could not find courier with call number ${radioCallNumber}`);
            } else {
                return courier;
            }
        });
}

jobSchema.statics.hydrateFromCsv = function(csvRow) {
    return hydrateFromCsv(csvRow, CSV_COLUMN_MAP)
        .then(fields => {
            return new this(fields);
        });
}

module.exports = mongoose.model('Job', jobSchema);
module.exports.CSV_COLUMN_MAP = CSV_COLUMN_MAP;
