const mongoose = require('mongoose');
const Client = require('./Client');
const Courier = require('./Courier');
const hydrateFromCsv = require('./hydrateFromCsv');
const rideSchema = new mongoose.Schema({
  jobId: { type: String, unique: true, required: true },
  externalId: { type: String },
  billingReference: { type: String },
  orderPlacer: { type: String },
  provider: { type: String },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  courier: { type: mongoose.Schema.Types.ObjectId, ref: 'Courier', required: true },
  originName: { type: String },
  originAddress: { type: String },
  originPostalCode: { type: String },
  originZone: { type: String },
  destinationName: { type: String },
  destinationAddress1: { type: String, required: [rideIsComplete, rideIsCompleteMessage('destinationAddress1')] },
  destinationAddress2: { type: String },
  destinationPostalCode: { type: String },
  destinationZone: { String },
  deliveryStatus: { type: String, enum: ['assigned', 'acknowledged', 'undeliverable', 'picked up', 'delivered', 'complete', 'cancelled'], lowercase: true, required: true },
  elapsedPickupTime: { type: String },
  transitTime: { type: String },
  fulfillmentTime: { type: String },
  timeLeft: { type: String },
  timeFrame: { type: String },
  creationTime: { type: Date },
  readyTime: { type: Date },
  dueTime: { type: Date },
  jobType: { type: Number },
  service: { type: String },
  rate: { type: String },
  isPaid: { type: Boolean },
  paymentMethod: { type: String },
  orderTotal: { type: Number, required: [rideIsComplete, rideIsCompleteMessage('orderTotal')] },
  billableTotal: { type: Number, required: [rideIsComplete, rideIsCompleteMessage('billableTotal')] },
  breakdown: { type: String },
  tip: { type: Number, required: [rideIsComplete, rideIsCompleteMessage('tip')] },
  deliveryFee: { type: Number, required: [rideIsComplete, rideIsCompleteMessage('deliveryFee')] },
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

function rideIsComplete() {
  return this.deliveryStatus === 'complete';
}

function rideIsCompleteMessage(field) {
  return `${field} is required when deliveryStatus is "complete"`;
}

rideSchema.index({
  jobId: 'text',
  originName: 'text'
});

rideSchema.index({ updatedAt: 1 });

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
  'elapsed pickup time': 'elapsedPickupTime',
  'transit time': 'transitTime',
  'fulfillment time': 'fulfillmentTime',
  'time left': 'timeLeft',
  'timeframe': 'timeFrame',
  'creation time': 'creationTime',
  'ready time': 'readyTime',
  'due time': 'dueTime',
  'job type': 'jobType',
  'service': 'service',
  'rate': 'rate',
  'is paid': { name: 'isPaid', hydrate: hydrateBoolean },
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

function hydrateBoolean (csvValue) {
  return ['true', 'yes', '1'].includes(csvValue.toLowerCase());
}

function hydrateClient (csvValue, csvRow, cache = {}) {
  const clientName = (csvValue || '').trim();
  const cacheKey = `client:${clientName}`;
  if (!clientName) {
    throw new Error('"client name" column is missing or empty.  This column is required');
  }

  const findClient = () => {
    return Client.find({ name: csvValue }).exec()
      .then(results => {
        if (!(results && results.length)) {
          return Client.find({ $text: { $search: `"${csvValue}"` } }).exec();
        } else {
          return results;
        }
      });
  };

  return (cache.hasOwnProperty(cacheKey) ? Promise.resolve(cache[cacheKey]) : findClient())
    .then(results => {
      cache[cacheKey] = results;
      if (!(results && results.length)) {
        throw new Error(`Could not find client "${csvValue}"`);
      } else if (results.length > 1) {
        const names = results.map(result => `"${result.name}"`).join(', ');
        throw new Error(`Ambiguous client name "${csvValue}" (matched ${results.length} clients: ${names})`);
      } else {
        return results[0];
      }
    });
}

function hydrateCourier (csvValue, csvRow, cache = {}) {
  const radioCallNumber = csvRow['courier number'];
  const cacheKey = `courier:${radioCallNumber}`;

  if (radioCallNumber === undefined) {
    throw new Error('"courier number" column is missing or empty. This column is required.');
  }

  const findCourier = () => Courier.findOne({ radioCallNumber }).exec();

  return (cache.hasOwnProperty(cacheKey) ? Promise.resolve(cache[cacheKey]) : findCourier())
    .then(courier => {
      cache[cacheKey] = courier;
      if (!courier) {
        throw new Error(`Could not find courier with call number ${radioCallNumber}`);
      } else {
        return courier;
      }
    });
}

rideSchema.statics.hydrateFromCsv = function (csvRow, cache = {}) {
  return hydrateFromCsv(csvRow, CSV_COLUMN_MAP, cache);
};

module.exports = mongoose.model('Ride', rideSchema);
module.exports.CSV_COLUMN_MAP = CSV_COLUMN_MAP;
module.exports.hydrateClient = hydrateClient;
module.exports.hydrateCourier = hydrateCourier
