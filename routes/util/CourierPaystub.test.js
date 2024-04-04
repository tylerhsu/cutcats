import CourierPaystub from './CourierPaystub';
import { fixtureModel } from '../../models/fixtures';

describe('CourierPaystub', function() {
  it('this.getCourierName() returns a string', function() {
    const courier = fixtureModel('Courier');
    const rides = [];
    const periodStart = new Date('2000-1-1');
    const periodEnd = new Date('2000-1-1');
    const courierPaystub = new CourierPaystub(courier, rides, periodStart, periodEnd);
    courierPaystub.getCourierName().should.be.a.String();
  });

  describe('getTipTotal()', function() {
    it('with no args, returns sum of ride.tip for all rides in period', function() {
      const client = fixtureModel('Client');
      const courier = fixtureModel('Courier');
      const rides = [
        fixtureModel('Ride', { client, readyTime: new Date('2000-1-1'), tip: 1 }),
        fixtureModel('Ride', { client, readyTime: new Date('2000-1-20'), tip: 2 }),
        fixtureModel('Ride', { client, readyTime: new Date('2000-1-20'), tip: 3 })
      ];
      const periodStart = new Date('2000-1-15');
      const periodEnd = new Date('2000-1-31');
      const courierPaystub = new CourierPaystub(courier, rides, periodStart, periodEnd);
      courierPaystub.getTipTotal().should.eql(5);
    });

    it('passed an array of rides, returns sum of ride.tip for those rides', function() {
      const client = fixtureModel('Client');
      const courier = fixtureModel('Courier');
      const rides = [
        fixtureModel('Ride', { client, readyTime: new Date('2000-1-1'), tip: 1 }),
        fixtureModel('Ride', { client, readyTime: new Date('2000-1-20'), tip: 2 }),
        fixtureModel('Ride', { client, readyTime: new Date('2000-1-20'), tip: 3 })
      ];
      const periodStart = new Date('2000-1-15');
      const periodEnd = new Date('2000-1-31');
      const courierPaystub = new CourierPaystub(courier, rides, periodStart, periodEnd);
      courierPaystub.getTipTotal(rides.slice(0,2)).should.eql(3);
    });
  });

  
  describe('getClientTipCredits()', function() {
    [
      'hannah\'s bretzel',
      'hannah\'s bretzel (franklin)',
      'HANNAH\'S BRETZEL',
    ].forEach(clientName => {
      it(`returns nonzero when pay period includes rides from a client called "${clientName}"`, function() {
        const client = fixtureModel('Client', { name: clientName });
        const courier = fixtureModel('Courier');
        const rides = [
          fixtureModel('Ride', { client, readyTime: new Date('2000-1-1'), tip: 1 }),
          fixtureModel('Ride', { client, readyTime: new Date('2000-1-20'), tip: 2 }),
          fixtureModel('Ride', { client, readyTime: new Date('2000-1-20'), tip: 3 })
        ];
        const periodStart = new Date('2000-1-15');
        const periodEnd = new Date('2000-1-31');
        const courierPaystub = new CourierPaystub(courier, rides, periodStart, periodEnd);
        courierPaystub.getClientTipCredits().should.be.greaterThan(0);
      });
    });

    it('returns zero when pay period does not include rides from "hannah\'s bretzel"', function() {
      const client = fixtureModel('Client');
      const courier = fixtureModel('Courier');
      const rides = [
        fixtureModel('Ride', { client, readyTime: new Date('2000-1-1'), tip: 1 }),
        fixtureModel('Ride', { client, readyTime: new Date('2000-1-20'), tip: 2 }),
        fixtureModel('Ride', { client, readyTime: new Date('2000-1-20'), tip: 3 })
      ];
      const periodStart = new Date('2000-1-15');
      const periodEnd = new Date('2000-1-31');
      const courierPaystub = new CourierPaystub(courier, rides, periodStart, periodEnd);
      courierPaystub.getClientTipCredits().should.eql(0);
    });
  });

  describe('this.getFeeTotal()', function() {
    it('with no args, .getFeeTotal() returns sum of ride.deliveryFee for all rides in period', function() {
      const client = fixtureModel('Client');
      const courier = fixtureModel('Courier');
      const rides = [
        fixtureModel('Ride', { client, readyTime: new Date('2000-1-1'), deliveryFee: 4 }),
        fixtureModel('Ride', { client, readyTime: new Date('2000-1-20'), deliveryFee: 5 }),
        fixtureModel('Ride', { client, readyTime: new Date('2000-1-20'), deliveryFee: 6 })
      ];
      const periodStart = new Date('2000-1-15');
      const periodEnd = new Date('2000-1-31');
      const courierPaystub = new CourierPaystub(courier, rides, periodStart, periodEnd);
      courierPaystub.getFeeTotal().should.eql(11);
    });

    it('passed an array of rides, returns sum of ride.deliveryFee for those rides', function() {
      const client = fixtureModel('Client');
      const courier = fixtureModel('Courier');
      const rides = [
        fixtureModel('Ride', { client, readyTime: new Date('2000-1-1'), deliveryFee: 4 }),
        fixtureModel('Ride', { client, readyTime: new Date('2000-1-20'), deliveryFee: 5 }),
        fixtureModel('Ride', { client, readyTime: new Date('2000-1-20'), deliveryFee: 6 })
      ];
      const periodStart = new Date('2000-1-15');
      const periodEnd = new Date('2000-1-31');
      const courierPaystub = new CourierPaystub(courier, rides, periodStart, periodEnd);
      courierPaystub.getFeeTotal(rides.slice(0,2)).should.eql(9);
    });
  });

  it('this.getDeliveryFeeTotal() returns sum of tips and delivery fees between periodEnd and periodStart', function() {
    const client = fixtureModel('Client');
    const courier = fixtureModel('Courier');
    const rides = [
      fixtureModel('Ride', { client, readyTime: new Date('2000-1-1'), tip: 1, deliveryFee: 4 }),
      fixtureModel('Ride', { client, readyTime: new Date('2000-1-20'), tip: 2, deliveryFee: 5 }),
      fixtureModel('Ride', { client, readyTime: new Date('2000-1-20'), tip: 3, deliveryFee: 6 })
    ];
    const periodStart = new Date('2000-1-15');
    const periodEnd = new Date('2000-1-31');
    const courierPaystub = new CourierPaystub(courier, rides, periodStart, periodEnd);
    courierPaystub.getDeliveryFeeTotal().should.eql(16);
  });

  it('this.getTipsCollectedByRider() returns sum of ride.tip for all rides in period whose client\'s paymentType is "paid"', function() {
    const paidClient = fixtureModel('Client', { paymentType: 'paid' });
    const invoicedClient = fixtureModel('Client', { paymentType: 'invoiced' });
    const courier = fixtureModel('Courier');
    const rides = [
      fixtureModel('Ride', { readyTime: new Date('2000-1-20'), tip: 1, deliveryFee: 5, client: paidClient }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-20'), tip: 2, deliveryFee: 6, client: paidClient }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-20'), tip: 3, deliveryFee: 7, client: invoicedClient }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-20'), tip: 4, deliveryFee: 8, client: invoicedClient })
    ];
    const periodStart = new Date('2000-1-15');
    const periodEnd = new Date('2000-1-31');
    const courierPaystub = new CourierPaystub(courier, rides, periodStart, periodEnd);
    courierPaystub.getTipsCollectedByRider().should.eql(3);
  });

  it('this.getFeesCollectedByRider() returns sum of ride.deliveryFee for all rides in period whose client\'s paymentType is "paid"', function() {
    const paidClient = fixtureModel('Client', { paymentType: 'paid' });
    const invoicedClient = fixtureModel('Client', { paymentType: 'invoiced' });
    const courier = fixtureModel('Courier');
    const rides = [
      fixtureModel('Ride', { readyTime: new Date('2000-1-20'), tip: 1, deliveryFee: 5, client: paidClient }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-20'), tip: 2, deliveryFee: 6, client: paidClient }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-20'), tip: 3, deliveryFee: 7, client: invoicedClient }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-20'), tip: 4, deliveryFee: 8, client: invoicedClient })
    ];
    const periodStart = new Date('2000-1-15');
    const periodEnd = new Date('2000-1-31');
    const courierPaystub = new CourierPaystub(courier, rides, periodStart, periodEnd);
    courierPaystub.getFeesCollectedByRider().should.eql(11);
  });

  it('this.getDeliveryFeeCollectedByRider() returns sum of tips and fees for all rides in period whose client\'s paymentType is "paid"', function() {
    const paidClient = fixtureModel('Client', { paymentType: 'paid' });
    const invoicedClient = fixtureModel('Client', { paymentType: 'invoiced' });
    const courier = fixtureModel('Courier');
    const rides = [
      fixtureModel('Ride', { readyTime: new Date('2000-1-20'), tip: 1, deliveryFee: 5, client: paidClient }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-20'), tip: 2, deliveryFee: 6, client: paidClient }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-20'), tip: 3, deliveryFee: 7, client: invoicedClient }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-20'), tip: 4, deliveryFee: 8, client: invoicedClient })
    ];
    const periodStart = new Date('2000-1-15');
    const periodEnd = new Date('2000-1-31');
    const courierPaystub = new CourierPaystub(courier, rides, periodStart, periodEnd);
    courierPaystub.getDeliveryFeeCollectedByRider().should.eql(14);
  });

  it('this.getTipsOwedToRider() returns sum of ride.tip for all rides in period whose client\'s paymentType is "invoiced"', function() {
    const paidClient = fixtureModel('Client', { paymentType: 'paid' });
    const invoicedClient = fixtureModel('Client', { paymentType: 'invoiced' });
    const courier = fixtureModel('Courier');
    const rides = [
      fixtureModel('Ride', { readyTime: new Date('2000-1-20'), tip: 1, deliveryFee: 5, client: paidClient }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-20'), tip: 2, deliveryFee: 6, client: paidClient }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-20'), tip: 3, deliveryFee: 7, client: invoicedClient }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-20'), tip: 4, deliveryFee: 8, client: invoicedClient })
    ];
    const periodStart = new Date('2000-1-15');
    const periodEnd = new Date('2000-1-31');
    const courierPaystub = new CourierPaystub(courier, rides, periodStart, periodEnd);
    courierPaystub.getTipsOwedToRider().should.eql(7);
  });

  it('this.getFeesOwedToRider() returns sum of ride.deliveryFee for all rides in period whose client\'s paymentType is "invoiced"', function() {
    const paidClient = fixtureModel('Client', { paymentType: 'paid' });
    const invoicedClient = fixtureModel('Client', { paymentType: 'invoiced' });
    const courier = fixtureModel('Courier');
    const rides = [
      fixtureModel('Ride', { readyTime: new Date('2000-1-20'), tip: 1, deliveryFee: 5, client: paidClient }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-20'), tip: 2, deliveryFee: 6, client: paidClient }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-20'), tip: 3, deliveryFee: 7, client: invoicedClient }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-20'), tip: 4, deliveryFee: 8, client: invoicedClient })
    ];
    const periodStart = new Date('2000-1-15');
    const periodEnd = new Date('2000-1-31');
    const courierPaystub = new CourierPaystub(courier, rides, periodStart, periodEnd);
    courierPaystub.getFeesOwedToRider().should.eql(15);
  });

  it('this.getDeliveryFeeOwedToRider() returns sum of tips and fees for all rides in period whose client\'s paymentType is "invoiced"', function() {
    const paidClient = fixtureModel('Client', { paymentType: 'paid' });
    const invoicedClient = fixtureModel('Client', { paymentType: 'invoiced' });
    const courier = fixtureModel('Courier');
    const rides = [
      fixtureModel('Ride', { readyTime: new Date('2000-1-20'), tip: 1, deliveryFee: 5, client: paidClient }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-20'), tip: 2, deliveryFee: 6, client: paidClient }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-20'), tip: 3, deliveryFee: 7, client: invoicedClient }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-20'), tip: 4, deliveryFee: 8, client: invoicedClient })
    ];
    const periodStart = new Date('2000-1-15');
    const periodEnd = new Date('2000-1-31');
    const courierPaystub = new CourierPaystub(courier, rides, periodStart, periodEnd);
    courierPaystub.getDeliveryFeeOwedToRider().should.eql(22);
  });

  describe('this.getToCC()', function() {
    beforeEach(function() {
      const courier = fixtureModel('Courier');
      const periodStart = new Date('2000-1-15');
      const periodEnd = new Date('2000-1-31');
      this.courierPaystub = new CourierPaystub(courier, [], periodStart, periodEnd);
    });
    
    it('when ride\'s client has deliveryFeeStructure == "on demand food", returns 25% of ride fee + ride tip', function() {
      const client = fixtureModel('Client', { deliveryFeeStructure: 'on demand food' });
      const rides = [
        fixtureModel('Ride', { client, deliveryFee: 2, tip: 10 }),
        fixtureModel('Ride', { client, deliveryFee: 6, tip: 10 }),
        fixtureModel('Ride', { client, deliveryFee: 6, tip: undefined }),
        fixtureModel('Ride', { client, deliveryFee: 10, tip: 10 })
      ];
      this.courierPaystub.getToCC(rides[0]).should.eql(3);
      this.courierPaystub.getToCC(rides[1]).should.eql(4);
      this.courierPaystub.getToCC(rides[2]).should.eql(1.5);
      this.courierPaystub.getToCC(rides[3]).should.eql(5);
    });

    it('when ride\'s client has deliveryFeeStructure == "legacy on demand food", returns 25% of ride fee + ride tip', function() {
      const client = fixtureModel('Client', { deliveryFeeStructure: 'legacy on demand food' });
      const rides = [
        fixtureModel('Ride', { client, deliveryFee: 2, tip: 10 }),
        fixtureModel('Ride', { client, deliveryFee: 6, tip: 10 }),
        fixtureModel('Ride', { client, deliveryFee: 6, tip: undefined }),
        fixtureModel('Ride', { client, deliveryFee: 10, tip: 10 })
      ];
      this.courierPaystub.getToCC(rides[0]).should.eql(3);
      this.courierPaystub.getToCC(rides[1]).should.eql(4);
      this.courierPaystub.getToCC(rides[2]).should.eql(1.5);
      this.courierPaystub.getToCC(rides[3]).should.eql(5);
    });

    it('when ride\'s client has deliveryFeeStructure == "catering food", returns 25% of ride fee + ride tip', function() {
      const client = fixtureModel('Client', { deliveryFeeStructure: 'catering food' });
      const rides = [
        fixtureModel('Ride', { client, deliveryFee: 2, tip: 10 }),
        fixtureModel('Ride', { client, deliveryFee: 6, tip: 10 }),
        fixtureModel('Ride', { client, deliveryFee: 6, tip: undefined }),
        fixtureModel('Ride', { client, deliveryFee: 10, tip: 10 })
      ];
      this.courierPaystub.getToCC(rides[0]).should.eql(3);
      this.courierPaystub.getToCC(rides[1]).should.eql(4);
      this.courierPaystub.getToCC(rides[2]).should.eql(1.5);
      this.courierPaystub.getToCC(rides[3]).should.eql(5);
    });

    it('when ride\'s client has deliveryFeeStructure == "cargo/wholesale/commissary", returns 25% of ride fee + ride tip', function() {
      const client = fixtureModel('Client', { deliveryFeeStructure: 'cargo/wholesale/commissary' });
      const rides = [
        fixtureModel('Ride', { client, deliveryFee: 2, tip: 10 }),
        fixtureModel('Ride', { client, deliveryFee: 6, tip: 10 }),
        fixtureModel('Ride', { client, deliveryFee: 6, tip: undefined }),
        fixtureModel('Ride', { client, deliveryFee: 10, tip: 10 })
      ];
      this.courierPaystub.getToCC(rides[0]).should.eql(3);
      this.courierPaystub.getToCC(rides[1]).should.eql(4);
      this.courierPaystub.getToCC(rides[2]).should.eql(1.5);
      this.courierPaystub.getToCC(rides[3]).should.eql(5);
    });

    it('throws an error when ride\'s client has an unrecognized deliveryFeeStructure', function() {
      const client = fixtureModel('Client', { deliveryFeeStructure: 'foo' });
      const ride = fixtureModel('Ride', { client });
      (() => {
        this.courierPaystub.getToCC(ride);
      }).should.throw(/Don't know how to calculate toCC/);
    });
  });

  it('this.getToCCTotal() returns a number', function() {
    const client = fixtureModel('Client');
    const courier = fixtureModel('Courier');
    const rides = [
      fixtureModel('Ride', { client, readyTime: new Date('2000-1-1'), tip: 1, deliveryFee: 4 }),
      fixtureModel('Ride', { client, readyTime: new Date('2000-1-20'), tip: 2, deliveryFee: 5 }),
      fixtureModel('Ride', { client, readyTime: new Date('2000-1-20'), tip: 3, deliveryFee: 6 })
    ];
    const periodStart = new Date('2000-1-15');
    const periodEnd = new Date('2000-1-31');
    const courierPaystub = new CourierPaystub(courier, rides, periodStart, periodEnd);
    courierPaystub.getToCCTotal().should.be.greaterThan(0);
  });

  describe('this.getRadioFee()', function() {
    it('returns 20 when rider has a radio checked out and paystub is mid-month', function() {
      const courier = fixtureModel('Courier', { monthlyRadioRental: true });
      const rides = [];
      const periodStart = new Date('2000-1-1');
      const periodEnd = new Date('2000-1-1');
      const courierPaystub = new CourierPaystub(courier, rides, periodStart, periodEnd);
      courierPaystub.getRadioFee().should.eql(20);
    });

    it('returns 20 when paystub is end-of-month and rider has a radio checked out', function() {
      const courier = fixtureModel('Courier', { monthlyRadioRental: true });
      const rides = [];
      const periodStart = new Date('2000-1-1');
      const periodEnd = new Date('2000-1-31');
      const courierPaystub = new CourierPaystub(courier, rides, periodStart, periodEnd);
      courierPaystub.getRadioFee().should.eql(20);
    });

    it('returns 0 when paystub is end-of-month and rider does not have a radio checked out', function() {
      const courier = fixtureModel('Courier', { monthlyRadioRental: false });
      const rides = [];
      const periodStart = new Date('2000-1-1');
      const periodEnd = new Date('2000-1-30');
      const courierPaystub = new CourierPaystub(courier, rides, periodStart, periodEnd);
      courierPaystub.getRadioFee().should.eql(0);
    });
  });
  
  it('this.getPaystubTotal() returns a number', function() {
    const client = fixtureModel('Client');
    const courier = fixtureModel('Courier');
    const rides = [
      fixtureModel('Ride', { client, readyTime: new Date('2000-1-1'), tip: 1, deliveryFee: 4 }),
      fixtureModel('Ride', { client, readyTime: new Date('2000-1-20'), tip: 2, deliveryFee: 5 }),
      fixtureModel('Ride', { client, readyTime: new Date('2000-1-20'), tip: 3, deliveryFee: 6 })
    ];
    const periodStart = new Date('2000-1-15');
    const periodEnd = new Date('2000-1-31');
    const courierPaystub = new CourierPaystub(courier, rides, periodStart, periodEnd);
    courierPaystub.getPaystubTotal().should.be.a.Number().and.not.NaN();
  });

  it('this.getPdfDocDefinition() returns an object', function() {
    const client = fixtureModel('Client');
    const courier = fixtureModel('Courier');
    const rides = [
      fixtureModel('Ride', { client, readyTime: new Date('2000-1-1'), tip: 1, deliveryFee: 4 }),
      fixtureModel('Ride', { client, readyTime: new Date('2000-1-20'), tip: 2, deliveryFee: 5 }),
      fixtureModel('Ride', { client, readyTime: new Date('2000-1-20'), tip: 3, deliveryFee: 6 })
    ];
    const periodStart = new Date('2000-1-15');
    const periodEnd = new Date('2000-1-31');
    const courierPaystub = new CourierPaystub(courier, rides, periodStart, periodEnd);
    const docDefinition = courierPaystub.getPdfDocDefinition();
    docDefinition.should.be.an.Object();
    docDefinition.should.have.keys('info', 'content');
  });
});
