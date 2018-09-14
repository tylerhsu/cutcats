import mongoose from 'mongoose';
const { ObjectID } = mongoose.mongo;
import models from '.';

const FIXTURES = {
  Invoice: () => ({
    periodStart: new Date('2000-01-01'),
    periodEnd: new Date('2000-01-15'),
    filePath: '/test.zip'
  }),
  Payroll: () => ({
    periodStart: new Date('2000-01-01'),
    periodEnd: new Date('2000-01-15'),
    filePath: '/test.zip'
  }),
  Ride: () => ({
    jobId:  new ObjectID().toString(),
    client: new ObjectID(),
    courier: new ObjectID(),
    destinationAddress1: 'destination address 1',
    deliveryStatus: 'complete',
    isPaid: true,
    orderTotal: 1,
    billableTotal: 2,
    deliveryFee: 3,
    tip: 4
  }),
  Client: () => ({
    name: `client ${new ObjectID()} name`,
    paymentType: 'invoiced',
    adminFeeType: 'scale'
  }),
  Courier: () => ({
    name: 'fixture courier',
    radioCallNumber: 1,
    status: 'member'
  }),
  Shift: () => ({
    amDispatcher: new ObjectID(),
    pmDispatcher: new ObjectID(),
    date: new Date('2000-01-01')
  })
};

export function fixtureJson(name, attrs) {
  return {
    ...FIXTURES[name](),
    ...attrs
  };
}

export function fixtureModel(name, attrs) {
  return new models[name](fixtureJson(name, attrs));
}

export function fixtureJsonArray(name, ...args) {
  let attrs = {};
  let quantity = 1;
  
  if (args.length === 1) {
    quantity = args[0];
  } else if (args.length === 2) {
    attrs = args[0];
    quantity = args[1];
  } else {
    throw new Error(`Expected 2 or 3 arguments, got ${arguments.length}`);
  }

  let objs = [];
  for (let n = 0; n < quantity; n++) {
    objs.push(fixtureJson(name, attrs));
  }
  return objs;
}

export function fixtureModelArray(name, ...args) {
  return fixtureJsonArray(name, ...args).map(models[name]);
}
