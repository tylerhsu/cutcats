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

  it('this.getTipTotal() returns sum of ride.tip for all rides in period', function() {
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

  it('this.getFeeTotal() returns sum of ride.deliveryFee for all rides in period', function() {
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

  xit('this.getPaystubTotal() returns delivery fees owed to rider plus dispatch pay minus "to cc" minus radio fee', function() {

  });
});
