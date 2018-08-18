import ClientInvoice from './ClientInvoice';
import { getId, idsShouldBeEqual } from './testUtils';
import { fixtureModel, fixtureModelArray } from '../../models/fixtures';

describe('ClientInvoice', function() {
  it('constructor assigns the expected member variables', function() {
    const client = fixtureModel('Client');
    const rides = fixtureModelArray('Ride', 3);
    const periodStart = new Date('2000-1-1');
    const periodEnd = new Date('2000-1-2');
    const clientInvoice = new ClientInvoice(client, rides, periodStart, periodEnd);
    clientInvoice.client.should.be.an.Object();
    idsShouldBeEqual(client, clientInvoice.client);
    clientInvoice.periodStart.should.be.a.Date();
    clientInvoice.periodStart.should.eql(periodStart);
    clientInvoice.periodEnd.should.be.a.Date();
    clientInvoice.periodEnd.should.eql(periodEnd);
    clientInvoice.ridesInPeriod.should.be.an.Array();
    clientInvoice.ridesInMonth.should.be.an.Array();
    clientInvoice.isMonthEnd.should.be.a.Boolean();
  });

  it('this.ridesInPeriod and this.ridesInMonth get set correctly', function() {
    const client = fixtureModel('Client');
    const rides = [
      fixtureModel('Ride', { readyTime: new Date('2000-1-1') }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-5') }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-10') })
    ];
    const periodStart = new Date('2000-1-1');
    const periodEnd = new Date('2000-1-6');
    const clientInvoice = new ClientInvoice(client, rides, periodStart, periodEnd);
    clientInvoice.ridesInPeriod.should.have.length(2);
    clientInvoice.ridesInMonth.should.have.length(3);
    clientInvoice.ridesInPeriod.map(getId).should.containEql(getId(rides[0]));
    clientInvoice.ridesInPeriod.map(getId).should.containEql(getId(rides[1]));
  });

  it('this.isMonthEnd is true when periodEnd falls on the last date of the month, and false otherwise', function() {
    const client = fixtureModel('Client');
    const rides = [];
    const periodStart = new Date('2000-1-1');
    const shouldNotBeMonthEnd = [
      new ClientInvoice(client, rides, periodStart, new Date('2000-1-30')),
      new ClientInvoice(client, rides, periodStart, new Date('2000-2-30')),
      new ClientInvoice(client, rides, periodStart, new Date('2000-2-31')),
      new ClientInvoice(client, rides, periodStart, new Date('2000-2-28')) // LEAP YEAR!!
    ];
    const shouldBeMonthEnd = [
      new ClientInvoice(client, rides, periodStart, new Date('2000-1-31')),
      new ClientInvoice(client, rides, periodStart, new Date('2000-2-29')), // LEAP YEAR!!
      new ClientInvoice(client, rides, periodStart, new Date('2001-2-28')),
      new ClientInvoice(client, rides, new Date('2000-1-15'), new Date('2000-1-31'))
    ];
    shouldNotBeMonthEnd.forEach((clientInvoice, n) => clientInvoice.isMonthEnd.should.be.false(`Expected clientInvoice[${n}].isMonthEnd to be false`));
    shouldBeMonthEnd.forEach((clientInvoice, n) => clientInvoice.isMonthEnd.should.be.true(`Expected clientInvoice[${n}].isMonthEnd to be true`));
  });

  it('this.getClientName() returns a string', function() {
    const client = fixtureModel('Client');
    const rides = [];
    const periodStart = new Date('2000-1-1');
    const periodEnd = new Date('2000-1-1');
    const clientInvoice = new ClientInvoice(client, rides, periodStart, periodEnd);
    clientInvoice.getClientName().should.be.a.String();
  });

  it('this.getDateRange() returns a string', function() {
    const client = fixtureModel('Client');
    const rides = [];
    const periodStart = new Date('2000-1-1');
    const periodEnd = new Date('2000-1-1');
    const clientInvoice = new ClientInvoice(client, rides, periodStart, periodEnd);
    clientInvoice.getDateRange().should.match(/2000/);
  });

  it('this.getNumRidesInPeriod() returns the number of rides that occurred between periodStart and periodEnd', function() {
    const client = fixtureModel('Client');
    const rides = [
      fixtureModel('Ride', { readyTime: new Date('2000-1-1') }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-5') }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-10') })
    ];
    const periodStart = new Date('2000-1-1');
    const periodEnd = new Date('2000-1-6');
    const clientInvoice = new ClientInvoice(client, rides, periodStart, periodEnd);
    clientInvoice.getNumRidesInPeriod().should.eql(2);
  });

  it('this.getNumRidesInMonth() returns the number of rides that were passed to the constructor, irrespective of periodStart and periodEnd', function() {
    const client = fixtureModel('Client');
    const rides = [
      fixtureModel('Ride', { readyTime: new Date('2000-1-1') }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-5') }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-10') })
    ];
    const periodStart = new Date('2000-1-1');
    const periodEnd = new Date('2000-1-6');
    const clientInvoice = new ClientInvoice(client, rides, periodStart, periodEnd);
    clientInvoice.getNumRidesInMonth().should.eql(3);
  });

  describe('this.getAdminFee() ', function() {
    it('returns 0 if this is not a month-end invoice', function() {
      const client = fixtureModel('Client', { adminFeeType: 'fixed', fixedAdminFee: 123 });
      const rides = fixtureModelArray('Ride', 3);
      const periodStart = new Date('2000-1-1');
      const periodEnd = new Date('2000-1-15');
      const clientInvoice = new ClientInvoice(client, rides, periodStart, periodEnd);
      clientInvoice.getAdminFee().should.eql(0);
    });

    it('when this is a month-end invoice and client.adminFeeType == "fixed", returns their fixed fee', function() {
      const client = fixtureModel('Client', { adminFeeType: 'fixed', fixedAdminFee: 123 });
      const rides = fixtureModelArray('Ride', 3);
      const periodStart = new Date('2000-1-16');
      const periodEnd = new Date('2000-1-31');
      const clientInvoice = new ClientInvoice(client, rides, periodStart, periodEnd);
      clientInvoice.getAdminFee().should.eql(client.fixedAdminFee);
    });

    it('when this is a month-end invoice and client.adminFeeType == "scale", returns different numbers based on number of rides in month', function() {
      const client = fixtureModel('Client', { adminFeeType: 'scale' });
      const periodStart = new Date('2000-1-16');
      const periodEnd = new Date('2000-1-31');
      const clientInvoices = [
        new ClientInvoice(client, [], periodStart, periodEnd),
        new ClientInvoice(client, fixtureModelArray('Ride', 1), periodStart, periodEnd),
        new ClientInvoice(client, fixtureModelArray('Ride', 30), periodStart, periodEnd),
        new ClientInvoice(client, fixtureModelArray('Ride', 90), periodStart, periodEnd),
        new ClientInvoice(client, fixtureModelArray('Ride', 210), periodStart, periodEnd)
      ];
      clientInvoices[0].getAdminFee().should.eql(50);
      clientInvoices[1].getAdminFee().should.eql(50);
      clientInvoices[2].getAdminFee().should.eql(75);
      clientInvoices[3].getAdminFee().should.eql(100);
      clientInvoices[4].getAdminFee().should.eql(125);
    });

    it('with options.explain == true, returns an object { value, reason }', function() {
      const client = fixtureModel('Client');
      const rides = fixtureModelArray('Ride', 3);
      const periodStart = new Date('2000-1-1');
      const periodEnd = new Date('2000-1-1');
      const clientInvoice = new ClientInvoice(client, rides, periodStart, periodEnd);
      const adminFee = clientInvoice.getAdminFee({ explain: true });
      adminFee.should.be.an.Object();
      adminFee.value.should.be.a.Number();
      adminFee.reason.should.be.a.String();
    });

    it('throws an error when client.adminFeeType is neither "fixed" nor "scale"', function() {
      const client = fixtureModel('Client', { adminFeeType: 'foo' });
      (() => {
        const clientInvoice = new ClientInvoice(client, [], new Date('2000-1-1'), new Date('2000-1-31'));
        clientInvoice.getAdminFee();
      }).should.throw(/don't know how to calculate admin fee/i);
    });
  });

  it('this.getTipTotal() returns sum of ride.tip for all rides in period', function() {
    const client = fixtureModel('Client');
    const rides = [
      fixtureModel('Ride', { readyTime: new Date('2000-1-1'), tip: 1 }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-20'), tip: 2 }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-20'), tip: 3 })
    ];
    const periodStart = new Date('2000-1-15');
    const periodEnd = new Date('2000-1-31');
    const clientInvoice = new ClientInvoice(client, rides, periodStart, periodEnd);
    clientInvoice.getTipTotal().should.eql(5);
  });

  it('this.getFeeTotal() returns sum of ride.deliveryFee for all rides in period', function() {
    const client = fixtureModel('Client');
    const rides = [
      fixtureModel('Ride', { readyTime: new Date('2000-1-1'), deliveryFee: 4 }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-20'), deliveryFee: 5 }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-20'), deliveryFee: 6 })
    ];
    const periodStart = new Date('2000-1-15');
    const periodEnd = new Date('2000-1-31');
    const clientInvoice = new ClientInvoice(client, rides, periodStart, periodEnd);
    clientInvoice.getFeeTotal().should.eql(11);
  });

  describe('this.getDeliveryFeeTotal()', function() {
    beforeEach(function() {
      this.client = fixtureModel('Client');
      this.rides = [
        fixtureModel('Ride', { readyTime: new Date('2000-1-1'), tip: 1, deliveryFee: 4 }),
        fixtureModel('Ride', { readyTime: new Date('2000-1-20'), tip: 2, deliveryFee: 5 }),
        fixtureModel('Ride', { readyTime: new Date('2000-1-20'), tip: 3, deliveryFee: 6 })
      ];
      this.periodStart = new Date('2000-1-15');
      this.periodEnd = new Date('2000-1-31');
    });
    
    it('returns 0 when client.paymentType == "paid"', function() {
      this.client.paymentType = 'paid';
      const clientInvoice = new ClientInvoice(this.client, this.rides, this.periodStart, this.periodEnd);
      clientInvoice.getDeliveryFeeTotal().should.eql(0);
    });

    it('returns sum of tips and delivery fees between periodEnd and periodStart when client.paymentType == "invoiced"', function() {
      this.client.paymentType = 'invoiced';
      const clientInvoice = new ClientInvoice(this.client, this.rides, this.periodStart, this.periodEnd);
      clientInvoice.getDeliveryFeeTotal().should.eql(16);
    });

    it('throws an error when client.paymentType is neither "paid" nor "invoiced"', function() {
      this.client.paymentType = 'foo';
      (() => {
        const clientInvoice = new ClientInvoice(this.client, this.rides, this.periodStart, this.periodEnd);
        clientInvoice.getDeliveryFeeTotal();
      }).should.throw(/don't know how to calculate delivery fee total/i);
    });
  });

  it('this.getInvoiceTotal() returns the sum of admin fee and delivery fee total', function() {
    const client = fixtureModel('Client', {
      adminFeeType: 'fixed',
      fixedAdminFee: 123,
      paymentType: 'invoiced'
    });
    const rides = fixtureModelArray('Ride', {
      readyTime: new Date('2000-1-20'),
      tip: 1
    }, 3);
    const periodStart = new Date('2000-1-16');
    const periodEnd = new Date('2000-1-31');
    const clientInvoice = new ClientInvoice(client, rides, periodStart, periodEnd);
    clientInvoice.getAdminFee().should.be.greaterThan(0);
    clientInvoice.getDeliveryFeeTotal().should.be.greaterThan(0);
    clientInvoice.getInvoiceTotal().should.eql(clientInvoice.getAdminFee() + clientInvoice.getDeliveryFeeTotal());
  });
});
